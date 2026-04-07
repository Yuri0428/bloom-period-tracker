import { NavLink } from 'react-router-dom';
import { Calendar, List, BarChart2, Settings, LogOut, Droplets } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import toast from 'react-hot-toast';

const phaseColors: Record<string, string> = {
  menstrual: '#ff6b9d',
  follicular: '#a78bfa',
  ovulation: '#34d399',
  luteal: '#f59e0b',
  unknown: '#6b7280',
};

const phaseLabels: Record<string, string> = {
  menstrual: 'Menstrual Phase',
  follicular: 'Follicular Phase',
  ovulation: 'Ovulation Phase',
  luteal: 'Luteal Phase',
  unknown: 'Tracking not started',
};

const phaseEmojis: Record<string, string> = {
  menstrual: '🌹',
  follicular: '🌱',
  ovulation: '🌸',
  luteal: '🍂',
  unknown: '🌙',
};

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const { currentPhase, currentCycleDay, nextPeriodPrediction } = useData();

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    if (onClose) onClose();
  };

  const links = [
    { to: '/dashboard', icon: <BarChart2 size={20} />, label: 'Dashboard' },
    { to: '/calendar', icon: <Calendar size={20} />, label: 'Calendar' },
    { to: '/list', icon: <List size={20} />, label: 'List View' },
    { to: '/log', icon: <Droplets size={20} />, label: 'Log Period' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="h-full flex flex-col py-6 px-4"
      style={{ background: 'linear-gradient(180deg, #1a0a2e 0%, #2d1b4e 100%)' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44de3)' }}>
          🌙
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-none" style={{ fontFamily: 'Playfair Display, serif' }}>Luna</h1>
          <p className="text-pink-400 text-xs">Cycle Tracker</p>
        </div>
      </div>

      {/* User Card */}
      <div className="rounded-2xl p-4 mb-6"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44de3)' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">{user?.name}</p>
            <p className="text-pink-300 text-xs truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Phase Card */}
      <div className="rounded-2xl p-4 mb-6"
        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${phaseColors[currentPhase]}30` }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{phaseEmojis[currentPhase]}</span>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Current Phase</p>
            <p className="font-semibold text-sm" style={{ color: phaseColors[currentPhase] }}>
              {phaseLabels[currentPhase]}
            </p>
          </div>
        </div>
        {currentCycleDay > 0 && (
          <div className="flex gap-3 mt-3 text-xs text-gray-400">
            <span>Day <b className="text-white">{currentCycleDay}</b></span>
            {nextPeriodPrediction && (
              <span>Next: <b className="text-pink-300">{nextPeriodPrediction}</b></span>
            )}
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                ? 'text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
            style={({ isActive }) => isActive ? {
              background: 'linear-gradient(135deg, rgba(255,107,157,0.2), rgba(196,77,227,0.2))',
              border: '1px solid rgba(255,107,157,0.3)',
              color: '#ff6b9d',
            } : {}}
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 mt-4">
        <LogOut size={20} />
        Sign Out
      </button>
    </div>
  );
}
