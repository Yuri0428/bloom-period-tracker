import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';
import { LogOut, Trash2, Save } from 'lucide-react';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { entries } = useData();

  const [name, setName] = useState(user?.name || '');
  const [cycleLength, setCycleLength] = useState(user?.cycleLength || 28);
  const [periodLength, setPeriodLength] = useState(user?.periodLength || 5);

  const handleSave = () => {
    updateUser({ name, cycleLength, periodLength });
    toast.success('Settings saved! 🌸');
  };

  const handleClearData = () => {
    if (confirm('This will permanently delete ALL your period entries. This cannot be undone. Continue?')) {
      const all = JSON.parse(localStorage.getItem('luna_entries') || '[]');
      const filtered = all.filter((e: any) => e.userId !== user?.id);
      localStorage.setItem('luna_entries', JSON.stringify(filtered));
      window.location.reload();
    }
  };

  const handleExport = () => {
    const data = JSON.stringify({ entries, exportedAt: new Date().toISOString(), user: { name: user?.name, email: user?.email } }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luna-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported! 📁');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">⚙️ Settings</h1>

      {/* Profile */}
      <Section title="👤 Profile">
        <div className="space-y-4">
          <Field label="Full Name">
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }} />
          </Field>
          <Field label="Email">
            <input value={user?.email || ''} disabled
              className="w-full px-4 py-3 rounded-xl text-gray-500 outline-none cursor-not-allowed"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} />
          </Field>
        </div>
      </Section>

      {/* Cycle Settings */}
      <Section title="🔄 Cycle Settings">
        <div className="space-y-6">
          <Field label={`Average Cycle Length: ${cycleLength} days`}>
            <input type="range" min={21} max={45} value={cycleLength} onChange={e => setCycleLength(Number(e.target.value))}
              className="w-full accent-pink-500" />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>21 days</span>
              <span>45 days</span>
            </div>
          </Field>
          <Field label={`Average Period Length: ${periodLength} days`}>
            <input type="range" min={2} max={10} value={periodLength} onChange={e => setPeriodLength(Number(e.target.value))}
              className="w-full accent-pink-500" />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>2 days</span>
              <span>10 days</span>
            </div>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <InfoCard label="Cycle Length" value={`${cycleLength}d`} color="#ff6b9d" />
            <InfoCard label="Period Length" value={`${periodLength}d`} color="#a78bfa" />
            <InfoCard label="Ovulation Day" value={`~${cycleLength - 14}d`} color="#34d399" />
          </div>
        </div>
      </Section>

      {/* Data */}
      <Section title="💾 Your Data">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div>
              <p className="text-white text-sm font-medium">Total Entries</p>
              <p className="text-gray-500 text-xs">{entries.length} period tracking entries</p>
            </div>
            <span className="text-pink-300 font-bold text-xl">{entries.length}</span>
          </div>
          <button onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-blue-300 font-medium text-sm transition-all hover:bg-blue-500/10"
            style={{ border: '1px solid rgba(96,165,250,0.3)' }}>
            📁 Export Data as JSON
          </button>
          <button onClick={handleClearData}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-400 font-medium text-sm transition-all hover:bg-red-500/10"
            style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
            <Trash2 size={16} /> Clear All Period Data
          </button>
        </div>
      </Section>

      {/* About */}
      <Section title="ℹ️ About Luna">
        <div className="space-y-2 text-sm text-gray-400">
          <p>Luna is a privacy-first period tracker. All your data is stored locally on your device.</p>
          <p>No accounts required beyond local storage. No data is ever sent to any server.</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {[
              { label: 'Version', value: '1.0.0' },
              { label: 'Data Storage', value: 'Local Only' },
              { label: 'Privacy', value: '100% Private' },
              { label: 'Tracking', value: 'No Analytics' },
            ].map(item => (
              <div key={item.label} className="flex justify-between p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <span className="text-gray-500 text-xs">{item.label}</span>
                <span className="text-gray-300 text-xs font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Save & Logout */}
      <div className="flex gap-3">
        <button onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44de3)' }}>
          <Save size={16} /> Save Settings
        </button>
        <button onClick={() => { logout(); toast.success('Signed out'); }}
          className="flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-red-400 transition-all hover:bg-red-500/10"
          style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <h2 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-gray-400 text-xs mb-2 font-medium">{label}</label>
      {children}
    </div>
  );
}

function InfoCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
      <div className="text-lg font-bold" style={{ color }}>{value}</div>
      <div className="text-gray-500 text-xs mt-0.5">{label}</div>
    </div>
  );
}
