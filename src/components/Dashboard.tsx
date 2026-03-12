import type { AnalysisResult } from '../types';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line
} from 'recharts';
import { MessageSquare, Heart, Clock, AlertTriangle, Zap, Smile, Timer, Moon, MessageCircle, Ruler, FileWarning, Skull, Flame, History, Scale } from 'lucide-react';

interface DashboardProps {
  data: AnalysisResult;
  onReset: () => void;
}

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6'];

export function Dashboard({ data, onReset }: DashboardProps) {
  const { participants, totalMessages, totalDays, messagesByDate, dominanceRatio, effortRatio, relationshipHistory, responseTimes, initiators, sentiment, commonWords, relationshipScore, traits, advice } = data;

  const scoreColor = relationshipScore > 80 ? 'text-green-500' : relationshipScore > 50 ? 'text-amber-500' : 'text-red-500';

  const radarData = [
    { subject: 'Respect', score: traits.respect },
    { subject: 'Love', score: traits.love },
    { subject: 'Bonding', score: traits.bonding },
    { subject: 'Fun', score: traits.fun },
    { subject: 'Conflict', score: traits.conflict },
  ];

  // Helper functions for superlatives
  const getTop = (key: keyof typeof participants[0]) => [...participants].sort((a,b) => (b[key] as number) - (a[key] as number))[0];

  return (
    <div className="w-full max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analysis Results</h1>
          <p className="text-slate-500">Between {participants.map(p => p.name).join(' & ')}</p>
        </div>
        <button 
          onClick={onReset}
          className="px-4 py-2 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
        >
          Analyze Another
        </button>
      </div>

      {/* Top Value Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Messages" 
          value={totalMessages.toLocaleString()} 
          subtitle={`Over ${totalDays} days`}
          icon={<MessageSquare className="text-indigo-500" />}
        />
        <StatCard 
          title="Relationship Score" 
          value={`${relationshipScore}%`} 
          subtitle="Based on tone & balance"
          valueClass={scoreColor}
          icon={<Heart className={scoreColor} />}
        />
        <StatCard 
          title="Fastest Replier" 
          value={responseTimes[0]?.name || 'N/A'} 
          subtitle={`Avg: ${Math.round(responseTimes[0]?.avgTimeMin || 0)} mins`}
          icon={<Timer className="text-orange-500" />}
        />
        <StatCard 
          title="Top Initiator" 
          value={initiators[0]?.name || 'N/A'} 
          subtitle={`${initiators[0]?.count || 0} conversations started`}
          icon={<Zap className="text-yellow-500" />}
        />
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Timeline Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Activity Timeline</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={messagesByDate} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#94a3b8'}} tickLine={false} axisLine={false} minTickGap={30} />
                <YAxis tick={{fontSize: 12, fill: '#94a3b8'}} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#475569', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dominance Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Conversation Balance</h3>
          <div className="h-64 w-full flex flex-col justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dominanceRatio}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="percentage"
                  nameKey="name"
                >
                  {dominanceRatio.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${Number(value).toFixed(1)}%`} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Traits Radar Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">Relationship Dimensions</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{fill: '#475569', fontSize: 14, fontWeight: 500}} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                <Tooltip formatter={(value: any) => `${Number(value)}/100`} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Laughter Index and Response Times */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <Smile className="mr-2 text-pink-500" />
                The Laughter Index
              </h3>
              <p className="text-sm text-slate-500 mb-4">Who uses more emojis, "haha", and "lol"?</p>
              
              <div className="space-y-4">
                {participants.map((p) => {
                  const maxLaughs = Math.max(...participants.map(part => part.laughCount));
                  const percentage = maxLaughs > 0 ? (p.laughCount / maxLaughs) * 100 : 0;
                  return (
                    <div key={p.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700">{p.name}</span>
                        <span className="text-slate-500">{p.laughCount} laughs</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <div className="bg-pink-400 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                <Clock className="mr-2 text-blue-500" />
                Response Habits
              </h3>
              <div className="flex bg-slate-50 rounded-xl p-4 gap-4">
                 {responseTimes.map(r => (
                   <div key={r.name} className="flex-1 text-center">
                     <p className="font-semibold text-slate-800">{r.name}</p>
                     <p className="text-xs text-slate-500">Takes ~{Math.round(r.avgTimeMin)} mins</p>
                   </div>
                 ))}
              </div>
            </div>
        </div>
      </div>

      {/* History & Effort Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Relationship History Line Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <History className="mr-2 text-indigo-500" />
            Relationship History (Score over time)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={relationshipHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{fill: '#94a3b8', fontSize: 12}} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Line type="monotone" dataKey="score" name="Health Score" stroke="#6366f1" strokeWidth={3} dot={{r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff'}} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Effort Ratio Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <Scale className="mr-2 text-emerald-500" />
            Relationship Effort
          </h3>
          <p className="text-sm text-slate-500 mb-4">Calculated heavily based on message word counts, conversation initiations, and fast response times.</p>
          <div className="h-64 relative flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={effortRatio}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="percentage"
                >
                  {effortRatio.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${Number(value).toFixed(1)}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Advanced Personality Insights */}
      <h3 className="text-2xl font-bold text-slate-800 mb-6 mt-12 text-center">Habits & Quirks</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        <StatCard 
          title="The Night Owl 🌙" 
          value={getTop('nightMessageCount')?.name} 
          subtitle={`${getTop('nightMessageCount')?.nightMessageCount} msgs sent between 12AM-6AM`}
          icon={<Moon className="text-indigo-600" />}
        />
        <StatCard 
          title="The Double Texter 📱" 
          value={getTop('doubleTextCount')?.name} 
          subtitle={`Sent 2+ messages ${getTop('doubleTextCount')?.doubleTextCount} times`}
          icon={<MessageCircle className="text-blue-500" />}
        />
        <StatCard 
          title="The Essay Writer 📝" 
          value={getTop('longestMessageChars')?.name} 
          subtitle={`Longest text: ${getTop('longestMessageChars')?.longestMessageChars} characters`}
          icon={<Ruler className="text-emerald-500" />}
        />
        
        <StatCard 
          title="Most Apologetic 🥺" 
          value={getTop('apologyCount')?.name} 
          subtitle={`Said "sorry" ${getTop('apologyCount')?.apologyCount} times`}
          icon={<Heart className="text-pink-400" />}
        />
        <StatCard 
          title="Most Inquisitive ❓" 
          value={getTop('questionCount')?.name} 
          subtitle={`Asked ${getTop('questionCount')?.questionCount} questions`}
          icon={<Zap className="text-yellow-500" />}
        />
        <StatCard 
          title="Most Enthusiastic ‼️" 
          value={getTop('exclamationCount')?.name} 
          subtitle={`Used ${getTop('exclamationCount')?.exclamationCount} exclamation marks`}
          icon={<Flame className="text-red-500" />}
        />

        <StatCard 
          title="The Sailor 🤬" 
          value={getTop('swearCount')?.name} 
          subtitle={`${getTop('swearCount')?.swearCount} profanities used`}
          icon={<FileWarning className="text-slate-600" />}
        />
        <StatCard 
          title="The Sweetheart 😘" 
          value={getTop('affectionCount')?.name} 
          subtitle={`${getTop('affectionCount')?.affectionCount} affectionate terms used`}
          icon={<Heart className="text-red-400" fill="currentColor" />}
        />
        <StatCard 
          title="Conversation Killer 💀" 
          value={getTop('conversationKills')?.name} 
          subtitle={`Killed the chat ${getTop('conversationKills')?.conversationKills} times`}
          icon={<Skull className="text-slate-800" />}
        />
      </div>
      
      {/* Sample Longest Text */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-8 max-w-4xl mx-auto shadow-sm">
        <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-3">Record Breaker: Longest Single Message</h4>
        <div className="relative">
          <MessageSquare className="absolute top-0 right-0 text-indigo-200/50 w-24 h-24 -mt-4 -mr-2" />
          <p className="text-slate-700 font-medium italic relative z-10 leading-relaxed max-h-48 overflow-y-auto pr-4">
            "{getTop('longestMessageChars')?.wordLongestMessage}"
          </p>
          <div className="mt-4 pt-4 border-t border-indigo-200/50 flex justify-between items-center z-10 relative">
            <span className="text-sm font-bold text-indigo-600">— {getTop('longestMessageChars')?.name}</span>
            <span className="text-xs text-indigo-500 bg-indigo-100 px-2 py-1 rounded-full">{getTop('longestMessageChars')?.longestMessageChars} chars</span>
          </div>
        </div>
      </div>

      {/* Lower Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sentiment Analysis */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Emotional Tone</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Positive', value: sentiment.positive, fill: '#10b981' },
                { name: 'Neutral', value: sentiment.neutral, fill: '#cbd5e1' },
                { name: 'Negative', value: sentiment.negative, fill: '#ef4444' }
              ]} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 500}} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Word Cloud / Common Words */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Top Used Words</h3>
          <div className="flex flex-wrap gap-2">
            {commonWords.slice(0, 20).map((w, i) => {
              const opacity = Math.max(0.3, 1 - (i * 0.05));
              const size = i < 3 ? 'text-xl font-bold' : i < 8 ? 'text-md font-medium' : 'text-sm';
              return (
                <span key={w.word} className={`text-indigo-600 ${size}`} style={{opacity}}>
                  {w.word}
                </span>
              );
            })}
          </div>
        </div>

        {/* Advice Panel */}
        <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-lg border border-transparent text-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10">
            <Heart size={160} />
          </div>
          
          <h3 className="text-lg font-bold mb-4 flex items-center z-10 relative">
            <AlertTriangle className="mr-2 h-5 w-5" /> Insights & Advice
          </h3>
          <div className="space-y-4 z-10 relative">
            {advice.map((adv, idx) => (
              <div key={idx} className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                <p className="text-indigo-50 leading-relaxed text-sm font-medium">{adv}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

function StatCard({ title, value, subtitle, icon, valueClass = 'text-slate-900' }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h4 className={`text-3xl font-bold ${valueClass} mb-1`}>{value}</h4>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
      <div className="p-3 bg-slate-50 rounded-xl">
        {icon}
      </div>
    </div>
  );
}
