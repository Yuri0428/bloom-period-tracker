import { useState } from 'react';
import { format } from 'date-fns';
import LogModal from '../components/LogModal';

export default function LogPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">🩸 Log Period</h1>
      <p className="text-gray-400 text-sm mb-8">Track your cycle, symptoms, moods, and more</p>

      <div className="rounded-3xl p-8 text-center space-y-6"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <label className="block text-pink-200 text-sm font-semibold uppercase tracking-wider mb-3">Select Date</label>
          <input
            type="date"
            value={date}
            max={today}
            onChange={e => setDate(e.target.value)}
            className="px-6 py-3 rounded-xl text-white outline-none text-center"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', colorScheme: 'dark' }}
          />
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-4 rounded-2xl font-bold text-white text-lg transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44de3)', boxShadow: '0 8px 25px rgba(196,77,227,0.4)' }}>
            🌸 Open Log Entry
          </button>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Today', date: today },
              { label: 'Yesterday', date: format(new Date(Date.now() - 86400000), 'yyyy-MM-dd') },
              { label: '2 days ago', date: format(new Date(Date.now() - 2 * 86400000), 'yyyy-MM-dd') },
            ].map(opt => (
              <button key={opt.label}
                onClick={() => { setDate(opt.date); setShowModal(true); }}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${date === opt.date ? 'text-pink-300 border-pink-500/50' : 'text-gray-400 border-white/10 hover:text-white hover:border-white/20'}`}
                style={date === opt.date ? { background: 'rgba(255,107,157,0.1)' } : {}}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <div className="grid grid-cols-2 gap-3 text-left">
            {[
              { icon: '🩸', title: 'Flow Level', desc: 'Track intensity from spotting to very heavy' },
              { icon: '⚡', title: 'Pain Level', desc: 'Rate pain from 0 (none) to 10 (severe)' },
              { icon: '🎭', title: 'Symptoms', desc: '17 symptoms including cramps, nausea, fatigue' },
              { icon: '😊', title: 'Mood', desc: '8 mood types to track emotional well-being' },
              { icon: '🌡️', title: 'Temperature', desc: 'Log basal body temperature daily' },
              { icon: '📝', title: 'Notes', desc: 'Free-form notes for any observations' },
            ].map(f => (
              <div key={f.title} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className="text-base mb-1">{f.icon}</p>
                <p className="text-white text-xs font-semibold">{f.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && <LogModal date={date} onClose={() => setShowModal(false)} />}
    </div>
  );
}
