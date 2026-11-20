import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardShell } from './components/DashboardShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingView } from './components/LandingView';

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-teal-700 rounded-full animate-spin" />
        <p className="mt-4 text-sm font-medium text-slate-600">Loading FinTrack Campus...</p>
      </div>
    );
  }

  return user ? <DashboardShell /> : <LandingView />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ErrorBoundary>
  );
}
