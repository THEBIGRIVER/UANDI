import type { ChatMessage, AnalysisResult, ParticipantStats, CharacterProfile } from '../types';

// Simple positive/negative word lists for client-side sentiment (English + Bengali)
const POSITIVE_WORDS = new Set(['love', 'good', 'great', 'awesome', 'amazing', 'happy', 'yay', 'yes', 'agree', 'beautiful', 'cute', 'sweet', 'thanks', 'thank', 'perfect', 'haha', 'lol', 'bhalo', 'bhalobasha', 'khub', 'darun', 'sundor', 'khushi', 'mishti', 'dhonnobad', 'shothik', 'valo']);
const NEGATIVE_WORDS = new Set(['bad', 'sad', 'hate', 'angry', 'mad', 'no', 'disagree', 'terrible', 'awful', 'cry', 'upset', 'annoyed', 'sorry', 'stress', 'kharap', 'rag', 'kanna', 'dukho', 'bhul', 'na', 'osubidha', 'birokto', 'kosto']);

// Trait specific word lists (English + Bengali)
const TRAIT_WORDS = {
  respect: new Set(['please', 'thanks', 'thank', 'appreciate', 'kind', 'respect', 'listen', 'understand', 'agree', 'helpful', 'sorry', 'value', 'dhonnobad', 'kkhoma', 'bhojhai', 'shon']),
  love: new Set(['love', 'miss', 'baby', 'babe', 'darling', 'sweetheart', 'heart', 'care', 'perfect', 'beautiful', 'handsome', 'cute', 'kisses', 'hug', 'hugs', 'bhalobashi', 'ador', 'shona', 'babu', 'jaan', 'pakhi', 'kolija', 'prem']),
  bonding: new Set(['we', 'us', 'our', 'together', 'both', 'share', 'always', 'forever', 'future', 'home', 'family', 'connect', 'talk', 'remember', 'amra', 'amader', 'aksathe', 'eksaathe', 'dujon', 'bhabishot']),
  conflict: new Set(['why', 'never', 'always', 'stop', 'hate', 'mad', 'angry', 'annoying', 'wrong', 'no', 'argue', 'fight', 'upset', 'tired', 'ignore', 'lie', 'keno', 'kakhono', 'mittha', 'jhogra', 'rag', 'dur', 'chap', 'na']),
  fun: new Set(['haha', 'lol', 'lmao', 'rofl', 'funny', 'joke', 'hilarious', 'laugh', 'crazy', 'fun', 'game', 'play', 'movie', 'party', 'weekend', 'lmfao', 'moja', 'hashi', 'pagol'])
};

// Advanced stat specific lists (English + Bengali)
const APOLOGY_WORDS = new Set(['sorry', 'apologies', 'apologize', 'mybad', 'forgive', 'dukkhito', 'kkhoma', 'maaf']);
const SWEAR_WORDS = new Set(['fuck', 'shit', 'bitch', 'asshole', 'damn', 'crap', 'hell', 'bastard', 'dick', 'sala', 'haramjada', 'kukur', 'shuor', 'magi', 'bal']);
const AFFECTION_WORDS = new Set(['love', 'miss', 'baby', 'babe', 'sweetheart', 'darling', 'beautiful', 'handsome', 'jaan', 'shona', 'babu', 'pakhi', 'kolija']);

// Emoji detection
const EMOJI_REGEX = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;

export function analyzeChat(messages: ChatMessage[]): AnalysisResult {
  if (messages.length === 0) {
    throw new Error("No valid messages found");
  }

  const participantsMap = new Map<string, ParticipantStats>();
  let totalWords = 0;
  
  const messagesByDateMap = new Map<string, number>();
  const messagesByHourMap = new Map<number, number>();
  const wordFrequency = new Map<string, number>();

  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  const traitCounts = {
    respect: 0,
    love: 0,
    bonding: 0,
    conflict: 0,
    fun: 0
  };

  let lastSender: string | null = null;
  let lastTimestamp: Date | null = null;
  const CONVERSATION_GAP_MS = 1000 * 60 * 60 * 4; // 4 hours gap means new conversation

  const responseTimesMap = new Map<string, { totalMs: number, count: number }>();

  // History Tracking (Grouped by Month-Year)
  const historyMap = new Map<string, { pos: number, neg: number, neu: number, msgCount: number }>();

  for (const msg of messages) {
    // 1. Participant Stats
    if (!participantsMap.has(msg.sender)) {
      participantsMap.set(msg.sender, {
        name: msg.sender,
        messageCount: 0,
        wordCount: 0,
        avgWordPerMessage: 0,
        longestStreak: 0,
        firstMessageDate: msg.timestamp,
        lastMessageDate: msg.timestamp,
        avgResponseTimeMin: 0,
        conversationInitiations: 0,
        laughCount: 0,
        apologyCount: 0,
        questionCount: 0,
        exclamationCount: 0,
        nightMessageCount: 0,
        doubleTextCount: 0,
        longestMessageChars: 0,
        wordLongestMessage: '',
        swearCount: 0,
        conversationKills: 0,
        affectionCount: 0
      });
      responseTimesMap.set(msg.sender, { totalMs: 0, count: 0 });
    }

    const pStat = participantsMap.get(msg.sender)!;
    pStat.messageCount++;
    
    const words = msg.content.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    pStat.wordCount += words.length;
    totalWords += words.length;
    
    if (msg.timestamp < pStat.firstMessageDate) pStat.firstMessageDate = msg.timestamp;
    if (msg.timestamp > pStat.lastMessageDate) pStat.lastMessageDate = msg.timestamp;

    // Advanced Static Metrics (Length, Punctuation, Hours)
    if (msg.content.length > pStat.longestMessageChars) {
      pStat.longestMessageChars = msg.content.length;
      pStat.wordLongestMessage = msg.content;
    }

    if (msg.content.includes('?')) pStat.questionCount++;
    if (msg.content.includes('!')) pStat.exclamationCount++;
    
    const h = msg.timestamp.getHours();
    if (h >= 0 && h < 6) {
      pStat.nightMessageCount++;
    }

    // Advanced Metrics: Initations, Response Times, and Flow Variables
    if (lastTimestamp) {
      const msDiff = msg.timestamp.getTime() - lastTimestamp.getTime();
      
      if (msDiff > CONVERSATION_GAP_MS) {
        // Gap > 4 hours = new conversation
        pStat.conversationInitiations++;
        
        // The last sender killed the conversation
        if (lastSender && participantsMap.has(lastSender)) {
           participantsMap.get(lastSender)!.conversationKills++;
        }
      } else if (lastSender !== msg.sender && lastSender !== null) {
        // Reply to someone else
        const rStats = responseTimesMap.get(msg.sender)!;
        rStats.totalMs += msDiff;
        rStats.count++;
      } else if (lastSender === msg.sender) {
        // Sent 2 messages in a row
        pStat.doubleTextCount++;
      }
    } else {
      // First ever message
      pStat.conversationInitiations++;
    }

    lastSender = msg.sender;
    lastTimestamp = msg.timestamp;

    // History period allocation
    // Formatting as MM-YYYY (e.g., 01-2023 for Jan 2023)
    const periodStr = `${String(msg.timestamp.getMonth() + 1).padStart(2, '0')}-${msg.timestamp.getFullYear()}`;
    if (!historyMap.has(periodStr)) {
      historyMap.set(periodStr, { pos: 0, neg: 0, neu: 0, msgCount: 0 });
    }
    const historyNode = historyMap.get(periodStr)!;
    historyNode.msgCount++;

    // 2. Trend Maps
    const dateStr = msg.timestamp.toLocaleDateString();
    messagesByDateMap.set(dateStr, (messagesByDateMap.get(dateStr) || 0) + 1);

    const hour = msg.timestamp.getHours();
    if (!isNaN(hour)) {
      messagesByHourMap.set(hour, (messagesByHourMap.get(hour) || 0) + 1);
    }

    // 3. Sentiment & Traits
    let msgPositive = 0;
    let msgNegative = 0;

    for (const w of words) {
      const cleanWord = w.replace(/[.,!?]/g, '');
      if (cleanWord.length > 3) {
        wordFrequency.set(cleanWord, (wordFrequency.get(cleanWord) || 0) + 1);
      }
      
      if (POSITIVE_WORDS.has(cleanWord)) msgPositive++;
      if (NEGATIVE_WORDS.has(cleanWord)) msgNegative++;
      
      // Check traits
      if (TRAIT_WORDS.respect.has(cleanWord)) traitCounts.respect++;
      if (TRAIT_WORDS.love.has(cleanWord)) traitCounts.love++;
      if (TRAIT_WORDS.bonding.has(cleanWord)) traitCounts.bonding++;
      if (TRAIT_WORDS.conflict.has(cleanWord)) traitCounts.conflict++;
      if (TRAIT_WORDS.fun.has(cleanWord)) {
        traitCounts.fun++;
        pStat.laughCount++;
      }

      // Check Advanced Vocab
      if (APOLOGY_WORDS.has(cleanWord)) pStat.apologyCount++;
      if (SWEAR_WORDS.has(cleanWord)) pStat.swearCount++;
      if (AFFECTION_WORDS.has(cleanWord)) pStat.affectionCount++;
    }

    // Emoji check for laughs
    const emojiMatch = msg.content.match(EMOJI_REGEX);
    if (emojiMatch) {
       pStat.laughCount += emojiMatch.length;
       traitCounts.fun += emojiMatch.length;
    }

    if (msgPositive > msgNegative) {
      positiveCount++;
      historyNode.pos++;
    } else if (msgNegative > msgPositive) {
      negativeCount++;
      historyNode.neg++;
    } else {
      neutralCount++;
      historyNode.neu++;
    }
  }

  // Finalize participant stats
  const participants = Array.from(participantsMap.values()).map(p => {
    const rStats = responseTimesMap.get(p.name);
    const avgResponseTimeMin = rStats && rStats.count > 0 ? (rStats.totalMs / rStats.count) / (1000 * 60) : 0;

    return {
      ...p,
      avgWordPerMessage: p.wordCount / p.messageCount,
      avgResponseTimeMin
    };
  }).sort((a,b) => b.messageCount - a.messageCount);

  // Dominance & Advanced Ratios
  const dominanceRatio = participants.map(p => ({
    name: p.name,
    percentage: (p.messageCount / messages.length) * 100
  }));

  const responseTimes = participants.map(p => ({
    name: p.name,
    avgTimeMin: p.avgResponseTimeMin
  })).sort((a,b) => a.avgTimeMin - b.avgTimeMin);

  const initiators = participants.map(p => ({
    name: p.name,
    count: p.conversationInitiations
  })).sort((a,b) => b.count - a.count);

  // Effort Ratio: Weighting message length (words), response times (inverted), and initiations
  // A simple composite metric to determine "Who puts in more absolute work" to maintain the chat.
  let totalEffortScore = 0;
  const effortData = participants.map(p => {
    // Score components
    const wordScore = p.wordCount; // Heavy weight
    const initScore = p.conversationInitiations * 10; // 10 words worth per initiation
    const responseSpeedScore = p.avgResponseTimeMin === 0 ? 0 : Math.max(0, 500 - p.avgResponseTimeMin); // The lower the time, the higher the score (max 500 equivalent words weight)

    const score = wordScore + initScore + responseSpeedScore;
    totalEffortScore += score;
    return { name: p.name, score };
  });

  const effortRatio = effortData.map(e => ({
    name: e.name,
    percentage: totalEffortScore > 0 ? (e.score / totalEffortScore) * 100 : 50 // Standardize to 100%
  }));

  // Format and Calculate Relationship History over time
  const relationshipHistory = Array.from(historyMap.entries())
    .map(([period, data]) => {
      const totalSentimental = data.pos + data.neg + data.neu;
      const periodScore = totalSentimental > 0 ? (data.pos - data.neg) / totalSentimental : 0;
      // Convert periodScore (-1 to 1) to (0 to 100)
      const normalizedScore = Math.round(((periodScore + 1) / 2) * 100);
      
      return {
        period,
        score: normalizedScore,
        positiveRatio: totalSentimental > 0 ? data.pos / totalSentimental : 0.5,
        messageCount: data.msgCount
      };
    })
    // Sort array chronologically by creating a date from the period string (e.g. "01-2023" -> Jan 1st 2023)
    .sort((a, b) => {
      const [aM, aY] = a.period.split('-');
      const [bM, bY] = b.period.split('-');
      return new Date(Number(aY), Number(aM)-1).getTime() - new Date(Number(bY), Number(bM)-1).getTime();
    });

  // Format arrays
  const messagesByDate = Array.from(messagesByDateMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const messagesByHour = Array.from(messagesByHourMap.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour);

  const commonWords = Array.from(wordFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word, count]) => ({ word, count }));

  // Relationship Score (Simulated)
  const totalSentiments = positiveCount + negativeCount + neutralCount;
  const sentimentScore = totalSentiments > 0 ? (positiveCount - negativeCount) / totalSentiments : 0;
  
  // Balance calculation (Penalty for one person dominating)
  let balancePenalty = 0;
  if (dominanceRatio.length >= 2) {
    const diff = Math.abs(dominanceRatio[0].percentage - dominanceRatio[1].percentage);
    balancePenalty = diff / 100; // 0 to 1
  }

  const relationshipScore = Math.round(((sentimentScore + 1) / 2 * 100) * (1 - balancePenalty * 0.5));

  // Advice Generator
  const advice: string[] = [];
  if (balancePenalty > 0.4) {
    advice.push(`${dominanceRatio[0].name} tends to lead the conversation. Try giving space for more balanced communication.`);
  } else {
    advice.push("You maintain a great balance in communication!");
  }

  if (sentimentScore > 0.3) {
    advice.push("Your conversations are highly positive and supportive.");
  } else if (sentimentScore < -0.1) {
    advice.push("There seems to be negative tension. Ensure to resolve conflicts gently.");
  }
  
  // Trait Advice
  if (traitCounts.conflict > traitCounts.respect + traitCounts.love) {
    advice.push("Conflict indicators are higher than affection. Give each other more grace and try to communicate calmly.");
  }
  if (traitCounts.fun > 20) {
    advice.push("You share a great sense of humor and have fun talking together!");
  }
  if (traitCounts.bonding > 15) {
    advice.push("Strong signs of bonding! You speak as a unified 'we' effectively.");
  }

  const daysDiff = messagesByDate.length > 0 ? 
    (new Date(messagesByDate[messagesByDate.length-1].date).getTime() - new Date(messagesByDate[0].date).getTime()) / (1000 * 3600 * 24) : 1;

  // New History / Effort Advice
  if (effortRatio.length >= 2) {
    const sortedEffort = [...effortRatio].sort((a,b) => b.percentage - a.percentage);
    if (sortedEffort[0].percentage > 65) {
      advice.push(`${sortedEffort[0].name} seems to be putting significantly more measurable 'effort' into maintaining the chat (longer messages, faster replies, starting convos).`);
    } else {
      advice.push(`You both put an incredibly equal amount of effort into the relationship! (${sortedEffort[0].percentage.toFixed(0)}% / ${sortedEffort[1].percentage.toFixed(0)}%)`);
    }
  }

  if (relationshipHistory.length > 3) {
    const firstScore = relationshipHistory[0].score;
    const recentScore = relationshipHistory[relationshipHistory.length - 1].score;
    
    if (recentScore < firstScore - 15) {
      advice.push(`Your relationship tone has cooled down slightly over time since the beginning. Remember to bring back the affection you had at the start!`);
    } else if (recentScore > firstScore + 10) {
      advice.push(`The relationship's positivity has strongly grown over time! It keeps getting better.`);
    } else {
      advice.push(`Your relationship has remained incredibly stable and consistent over the months.`);
    }
  }

  // Normalize traits logically into 0-100 scores relative to total messages and general thresholds
  const normalizeScore = (count: number, threshold: number) => Math.min(100, Math.round((count / Math.max(1, messages.length / threshold)) * 100));

  // Generate Character Profiles
  const characterProfiles: CharacterProfile[] = participants.map(p => {
    // Relative scores (normalized to other participant if possible)
    const other = participants.find(op => op.name !== p.name) || p;
    
    // Expressiveness: Emojis, exclamation marks, laughs
    const expScore = Math.min(100, Math.round(((p.laughCount + p.exclamationCount * 2) / Math.max(1, p.messageCount)) * 200));
    
    // Positivity: Based on affection words and laughs relative to swearing/conflict
    const posScore = Math.min(100, Math.round(50 + ((p.affectionCount + p.laughCount - p.swearCount - p.conversationKills) / Math.max(1, p.messageCount)) * 100));
    
    // Engagement: How often they initiate, reply fast, and write long messages
    const engScore = Math.min(100, Math.round(((p.conversationInitiations * 10 + p.wordCount / 5) / Math.max(1, p.messageCount)) * 50));
    
    // Patience: How long they wait vs double text
    const responseTimeInvert = Math.max(0, 100 - p.avgResponseTimeMin);
    const patScore = Math.min(100, Math.max(0, Math.round(responseTimeInvert - (p.doubleTextCount / Math.max(1, p.messageCount)) * 100)));
    
    let persona = "The Balanced Texter";
    let description = "You have a balanced and grounded approach to communication.";
    
    const isNightOwl = p.nightMessageCount > p.messageCount * 0.15;
    const isNovelist = p.avgWordPerMessage > 12;
    const isExpressive = expScore > 60;
    const isQuick = p.avgResponseTimeMin > 0 && p.avgResponseTimeMin < 5;
    const isInitiator = other.conversationInitiations > 0 && p.conversationInitiations > other.conversationInitiations * 1.5;
    const isLover = p.affectionCount > p.messageCount * 0.03;
    
    if (isLover) {
      persona = "The Hopeless Romantic";
      description = "You frequently use sweet and affectionate terms. You make sure your partner feels loved through words.";
    } else if (isNightOwl) {
      persona = "The Night Owl";
      description = "You do your best communicating late at night. The quiet hours are when you're most active.";
    } else if (isNovelist) {
      persona = "The Novelist";
      description = "You tend to write long, detailed messages instead of firing off quick, short texts. You value depth.";
    } else if (isExpressive) {
      persona = "The Expressive";
      description = "You are highly reactive! You use lots of punctuation and laughs to convey your strong emotions.";
    } else if (isInitiator) {
      persona = "The Initiator";
      description = "You are often the one reaching out first to start conversations. You actively maintain the connection.";
    } else if (isQuick) {
      persona = "The Speedster";
      description = "You reply extremely fast! You are highly attentive when a conversation is happening.";
    } else if (p.messageCount > other.messageCount * 1.5) {
      persona = "The Chatterbox";
      description = "You naturally send more messages and dominate the conversation flow—you have a lot to say!";
    } else if (p.questionCount > p.messageCount * 0.1) {
      persona = "The Inquisitor";
      description = "You ask a lot of questions. You are curious and always want to know more about the other person.";
    } else if (p.avgResponseTimeMin > 60) {
      persona = "The Relaxed Texter";
      description = "You don't rush to reply. You take your time responding and don't let the phone control you.";
    }

    return {
      name: p.name,
      persona,
      description,
      traits: {
        expressiveness: Math.max(0, expScore),
        positivity: Math.max(0, posScore),
        engagement: Math.max(0, engScore),
        patience: Math.max(0, patScore)
      }
    };
  });

  return {
    participants,
    totalMessages: messages.length,
    totalDays: Math.max(1, Math.ceil(daysDiff)),
    messagesByDate,
    messagesByHour,
    dominanceRatio,
    effortRatio,
    relationshipHistory,
    responseTimes,
    initiators,
    sentiment: {
      positive: positiveCount,
      negative: negativeCount,
      neutral: neutralCount,
      score: sentimentScore
    },
    commonWords,
    relationshipScore,
    traits: {
      respect: normalizeScore(traitCounts.respect, 10), // Example: 1 respect word per 10 messages = 100%
      love: normalizeScore(traitCounts.love, 15),
      bonding: normalizeScore(traitCounts.bonding, 10),
      conflict: normalizeScore(traitCounts.conflict, 20),
      fun: normalizeScore(traitCounts.fun, 15)
    },
    advice,
    characterProfiles
  };
}
