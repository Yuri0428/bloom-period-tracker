import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0f0720' }}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-72 flex-shrink-0 border-r border-white/5">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 flex-shrink-0 z-10">
            <Sidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-4 px-4 py-3 border-b border-white/5"
          style={{ background: '#1a0a2e' }}>
          <button onClick={() => setMobileOpen(true)} className="text-gray-400 hover:text-white p-1">
            <Menu size={22} />
          </button>
          <h1 className="text-white font-bold text-lg" style={{ fontFamily: 'Playfair Display, serif' }}>🌙 Luna</h1>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
