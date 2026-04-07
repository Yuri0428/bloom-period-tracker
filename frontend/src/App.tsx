import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import AuthPage from './components/auth/AuthPage';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import ListView from './pages/ListView';
import LogPage from './pages/LogPage';
import Settings from './pages/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 100%)' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse"
            style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44de3)' }}>
            🌙
          </div>
          <p className="text-pink-300 text-sm">Loading Luna...</p>
        </div>
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/auth" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><DataProvider><AppLayout /></DataProvider></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="list" element={<ListView />} />
        <Route path="log" element={<LogPage />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#2d1b4e',
              color: '#f9a8d4',
              border: '1px solid rgba(255,107,157,0.3)',
              borderRadius: '12px',
            },
            success: {
              iconTheme: { primary: '#ff6b9d', secondary: '#2d1b4e' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#2d1b4e' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
