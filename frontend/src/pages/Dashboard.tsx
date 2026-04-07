import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Droplets, Activity, Heart, TrendingUp, Plus } from 'lucide-react';
import LogModal from '../components/LogModal';

const phaseInfo: Record<string, { color: string; bg: string; desc: string; tips: string[] }> = {
  menstrual: {
    color: '#ff6b9d',
    bg: 'rgba(255,107,157,0.1)',
    desc: 'Your body is shedding the uterine lining. Rest, warmth, and gentle movement are your best friends.',
    tips: ['🍵 Drink warm herbal teas', '🛁 Use a heating pad for cramps', '🧘 Try gentle yoga or stretching', '💊 Take iron-rich foods'],
  },
  follicular: {
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.1)',
    desc: 'Estrogen is rising! You may feel more energetic, creative, and social during this phase.',
    tips: ['🏃 Great time for high-intensity workouts', '🎨 Channel creative energy', '🥗 Focus on antioxidant-rich foods', '📚 Start new projects'],
  },
  ovulation: {
    color: '#34d399',
    bg: 'rgba(52,211,153,0.1)',
    desc: 'Your most fertile window. Energy and libido are typically at their peak.',
    tips: ['💪 Peak athletic performance', '🗣️ Great time for important conversations', '🥦 Eat cruciferous vegetables', '😴 Maintain sleep schedule'],
  },
  luteal: {
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    desc: 'Progesterone rises then falls. You may notice PMS symptoms in the latter part of this phase.',
    tips: ['🍫 Manage cravings mindfully', '🧘 Prioritize stress reduction', '😴 Ensure quality sleep', '🚶 Light to moderate exercise'],
  },
  unknown: {
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.1)',
    desc: 'Start logging your period to get personalized cycle insights and predictions.',
    tips: ['🩸 Log your first period to begin tracking', '📅 Set your average cycle length', '✍️ Add daily symptoms for better insights'],
  },
};

export default function Dashboard() {
  const { user } = useAuth();
  const { currentPhase, currentCycleDay, nextPeriodPrediction, nextOvulation, lastPeriodStart, entries } = useData();
  console.log({currentCycleDay})
  const [logDate, setLogDate] = useState<string | null>(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  const info = phaseInfo[currentPhase];
  const cycleLength = user?.cycleLength || 28;

  const daysUntilPeriod = nextPeriodPrediction
    ? differenceInDays(parseISO(nextPeriodPrediction), new Date())
    : null;

  const daysUntilOvulation = nextOvulation
    ? differenceInDays(parseISO(nextOvulation), new Date())
    : null;

  // Stats
  const recentEntries = entries.slice(-7);
  const avgPain = recentEntries.length > 0
    ? (recentEntries.reduce((s, e) => s + e.painLevel, 0) / recentEntries.length).toFixed(1)
    : '—';
  const totalPeriodDays = entries.filter(e => e.flow).length;
  const mostCommonSymptom = (() => {
    const counts: Record<string, number> = {};
    entries.forEach(e => e.symptoms.forEach(s => { counts[s] = (counts[s] || 0) + 1; }));
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0]?.replace('_', ' ') || '—';
  })();

  // Cycle ring progress
  const progress = currentCycleDay > 0 ? Math.min((currentCycleDay / cycleLength) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}! 🌸
          </h1>
          <p className="text-gray-400 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <button onClick={() => setLogDate(today)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44de3)' }}>
          <Plus size={16} /> Log Today
        </button>
      </div>

      {/* Phase Hero Card */}
      <div className="rounded-3xl p-6 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${info.bg}, rgba(255,255,255,0.02))`, border: `1px solid ${info.color}30` }}>
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Cycle Ring */}
          <div className="flex flex-col items-center flex-shrink-0">
            <svg width="130" height="130" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle cx="65" cy="65" r="54" fill="none" stroke={info.color} strokeWidth="10"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 65 65)" style={{ transition: 'stroke-dashoffset 1s ease' }} />
              <text x="65" y="58" textAnchor="middle" fill="white" fontSize="20" fontWeight="700">
                {currentCycleDay > 0 ? currentCycleDay : '?'}
              </text>
              <text x="65" y="74" textAnchor="middle" fill="#9ca3af" fontSize="10">
                {currentCycleDay > 0 ? 'of ' + cycleLength : 'days'}
              </text>
            </svg>
            <p className="text-xs text-gray-400 mt-1">Cycle Day</p>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
                style={{ background: `${info.color}20`, color: info.color, border: `1px solid ${info.color}40` }}>
                {currentPhase} phase
              </span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">{info.desc}</p>
            <div className="grid grid-cols-2 gap-2">
              {info.tips.map((tip, i) => (
                <div key={i} className="text-xs text-gray-400 bg-white/5 rounded-xl px-3 py-2">{tip}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Droplets size={20} />}
          label="Next Period"
          value={daysUntilPeriod !== null ? (daysUntilPeriod === 0 ? 'Today' : daysUntilPeriod < 0 ? `${Math.abs(daysUntilPeriod)}d late` : `${daysUntilPeriod}d`) : '—'}
          sub={nextPeriodPrediction ? format(parseISO(nextPeriodPrediction), 'MMM d') : 'No data'}
          color="#ff6b9d"
        />
        <StatCard
          icon={<Heart size={20} />}
          label="Next Ovulation"
          value={daysUntilOvulation !== null ? (daysUntilOvulation === 0 ? 'Today' : daysUntilOvulation < 0 ? 'Passed' : `${daysUntilOvulation}d`) : '—'}
          sub={nextOvulation ? format(parseISO(nextOvulation), 'MMM d') : 'No data'}
          color="#34d399"
        />
        <StatCard
          icon={<Activity size={20} />}
          label="Avg Pain (7d)"
          value={avgPain}
          sub="out of 10"
          color="#f59e0b"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Period Days"
          value={totalPeriodDays.toString()}
          sub="total logged"
          color="#a78bfa"
        />
      </div>

      {/* Quick Log + Recent */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Stats */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">📊 Cycle Overview</h3>
          <div className="space-y-3">
            <Row label="Cycle Length" value={`${cycleLength} days`} />
            <Row label="Period Length" value={`${user?.periodLength || 5} days`} />
            <Row label="Last Period" value={lastPeriodStart ? format(parseISO(lastPeriodStart), 'MMM d, yyyy') : 'Not logged'} />
            <Row label="Most Common Symptom" value={mostCommonSymptom} />
            <Row label="Total Entries" value={entries.length.toString()} />
          </div>
        </div>

        {/* Recent Entries */}
        <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 className="text-white font-semibold mb-4">🕐 Recent Entries</h3>
          {entries.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-4xl mb-2">📝</p>
              <p className="text-gray-500 text-sm">No entries yet. Start logging your cycle!</p>
              <button onClick={() => setLogDate(today)}
                className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44de3)' }}>
                Log First Entry
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {[...entries].reverse().slice(0, 8).map(entry => (
                <button key={entry.id} onClick={() => setLogDate(entry.date)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left">
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: entry.flow ? '#ff6b9d' : '#6b7280' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium">{format(parseISO(entry.date), 'MMM d, yyyy')}</p>
                    <p className="text-gray-500 text-xs truncate">
                      {[entry.flow && `Flow: ${entry.flow}`, entry.painLevel > 0 && `Pain: ${entry.painLevel}/10`, ...entry.symptoms.slice(0, 2)].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {entry.moods.length > 0 && (
                    <span className="text-sm">{entry.moods[0] === 'happy' ? '😊' : entry.moods[0] === 'sad' ? '😢' : entry.moods[0] === 'anxious' ? '😰' : entry.moods[0] === 'irritable' ? '😤' : entry.moods[0] === 'calm' ? '😌' : entry.moods[0] === 'energetic' ? '⚡' : entry.moods[0] === 'exhausted' ? '😩' : '🥺'}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {logDate && <LogModal date={logDate} onClose={() => setLogDate(null)} />}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}20` }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg" style={{ background: `${color}20`, color }}>{icon}</div>
        <p className="text-gray-400 text-xs font-medium">{label}</p>
      </div>
      <p className="text-white text-2xl font-bold">{value}</p>
      <p className="text-gray-500 text-xs mt-0.5">{sub}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-white text-sm font-medium capitalize">{value}</span>
    </div>
  );
}
