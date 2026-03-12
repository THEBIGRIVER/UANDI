export interface ChatMessage {
  id: string;
  timestamp: Date;
  sender: string;
  content: string;
  isSystem: boolean; // e.g. "Messages and calls are end-to-end encrypted"
}

export interface ParticipantStats {
  name: string;
  messageCount: number;
  wordCount: number;
  avgWordPerMessage: number;
  longestStreak: number;
  firstMessageDate: Date;
  lastMessageDate: Date;
  avgResponseTimeMin: number; // Average time to reply in minutes
  conversationInitiations: number; // How often they start a new conversation
  laughCount: number; // How often they use haha/lol/emojis
  
  // 10 New Advanced Stats
  apologyCount: number; // 1. "Sorry" / "Apologize"
  questionCount: number; // 2. Ends in "?"
  exclamationCount: number; // 3. Ends in "!" 
  nightMessageCount: number; // 4. Activity between 12 AM and 6 AM
  doubleTextCount: number; // 5. Sending 2+ messages before reply
  longestMessageChars: number; // 6. Longest text
  wordLongestMessage: string; // The literal message
  swearCount: number; // 7. Swear word / profanity count
  conversationKills: number; // 8. Last message before a 4h gap
  affectionCount: number; // 9. Specific sweet/love words
}

export interface SentimentAnalysis {
  positive: number;
  negative: number;
  neutral: number;
  score: number; // -1 to 1
}

export interface RelationshipTraits {
  respect: number;
  love: number;
  bonding: number;
  conflict: number;
  fun: number;
}

export interface AnalysisResult {
  participants: ParticipantStats[];
  totalMessages: number;
  totalDays: number;
  messagesByDate: { date: string; count: number }[];
  messagesByHour: { hour: number; count: number }[];
  dominanceRatio: { name: string; percentage: number }[];
  effortRatio: { name: string; percentage: number }[]; // Calculated based on initiation, length of message, & response time
  relationshipHistory: { 
    period: string; // e.g. "Month 1" or "Jan 2023"
    score: number;
    positiveRatio: number;
    messageCount: number;
  }[];
  responseTimes: { name: string; avgTimeMin: number }[];
  initiators: { name: string; count: number }[];
  sentiment: SentimentAnalysis;
  commonWords: { word: string; count: number }[];
  relationshipScore: number;
  traits: RelationshipTraits;
  advice: string[];
}
