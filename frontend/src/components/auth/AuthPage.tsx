import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup' && password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        toast.success('Welcome back! 🌸');
      } else {
        await signup(name, email, password);
        toast.success('Account created! Welcome to Luna 🌙');
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 30%, #4a1942 60%, #6b2d5e 100%)' }}>
      {/* Floating blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="particle particle-1">🌸</div>
        <div className="particle particle-2">✨</div>
        <div className="particle particle-3">🌙</div>
        <div className="particle particle-4">💫</div>
        <div className="particle particle-5">🌺</div>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
            style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44de3)' }}>
            <span className="text-4xl">🌙</span>
          </div>
          <h1 className="text-4xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>Luna</h1>
          <p className="text-pink-200 mt-1 text-sm tracking-widest uppercase">Period & Cycle Tracker</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8 shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)' }}>
          {/* Tabs */}
          <div className="flex rounded-2xl p-1 mb-8" style={{ background: 'rgba(0,0,0,0.2)' }}>
            {(['login', 'signup'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${mode === m
                  ? 'text-white shadow-lg'
                  : 'text-pink-300 hover:text-white'
                }`}
                style={mode === m ? { background: 'linear-gradient(135deg, #ff6b9d, #c44de3)' } : {}}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-pink-200 text-xs font-semibold uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-pink-300/50 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                />
              </div>
            )}
            <div>
              <label className="block text-pink-200 text-xs font-semibold uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl text-white placeholder-pink-300/50 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              />
            </div>
            <div>
              <label className="block text-pink-200 text-xs font-semibold uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl text-white placeholder-pink-300/50 outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              />
            </div>
            {mode === 'signup' && (
              <div>
                <label className="block text-pink-200 text-xs font-semibold uppercase tracking-wider mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-pink-300/50 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white mt-2 transition-all duration-300 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44de3)', boxShadow: '0 8px 25px rgba(196,77,227,0.4)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          {mode === 'login' && (
            <p className="text-center text-pink-300/60 text-xs mt-5">
              Demo: Use any email & password (min 6 chars)
            </p>
          )}
        </div>

        <p className="text-center text-pink-300/40 text-xs mt-6">
          Your data is stored securely on this device 🔒
        </p>
      </div>
    </div>
  );
}
