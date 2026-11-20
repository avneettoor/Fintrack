import { useState } from 'react';
import { CheckCircle2, MailCheck, RefreshCw } from 'lucide-react';
import { BrandLogo } from './components/BrandLogo';
import { DashboardShell } from './components/DashboardShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingView } from './components/LandingView';
import { OnboardingFlow } from './components/OnboardingFlow';
import { AuthProvider, useAuth } from './context/AuthContext';

function EmailVerificationGate() {
  const {
    user,
    resendVerificationEmail,
    refreshUserSession,
    signInWithGoogle,
    logout,
    signingIn,
  } = useAuth();
  const [resent, setResent] = useState(false);
  const [checking, setChecking] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!user) return null;

  const handleCheck = async () => {
    setChecking(true);
    setStatusMsg(null);
    try {
      await refreshUserSession();
      setStatusMsg('Checked verification status. If you just clicked the email link, wait a second and click again.');
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setStatusMsg(null);
    await resendVerificationEmail();
    setResent(true);
    setStatusMsg(`Verification link sent to ${user.email}. Check your inbox or spam folder.`);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm text-center">
        <div className="flex justify-center mb-5">
          <BrandLogo size="md" />
        </div>
        <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-[#18A879] flex items-center justify-center mb-4">
          <MailCheck className="w-6 h-6" />
        </div>
        <h1 className="font-display text-xl font-bold text-[#172B4D] dark:text-white">
          Verify your campus email
        </h1>
        <p className="mt-2 text-sm text-[#8490A5] leading-relaxed">
          We sent a verification link to <strong className="text-[#172B4D] dark:text-white">{user.email}</strong>. Verify your email to unlock your FinTrack Campus workspace.
        </p>

        {statusMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
            {statusMsg}
          </div>
        )}

        <div className="mt-6 space-y-2.5">
          <button
            type="button"
            disabled={checking}
            onClick={handleCheck}
            className="w-full py-2.5 px-4 rounded-xl bg-[#18A879] hover:bg-[#149369] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{checking ? 'Checking...' : "I've Verified My Email"}</span>
          </button>

          <button
            type="button"
            onClick={handleResend}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-[#172B4D] dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{resent ? 'Verification Sent Again' : 'Resend Verification Email'}</span>
          </button>

          <button
            type="button"
            disabled={signingIn}
            onClick={signInWithGoogle}
            className="w-full py-2.5 px-4 rounded-xl bg-[#172B4D] hover:bg-[#0f1e38] text-white text-sm font-semibold disabled:opacity-60"
          >
            Continue with Google Instead
          </button>

          <button
            type="button"
            onClick={() => void logout()}
            className="w-full py-2 text-xs font-medium text-[#8490A5] hover:text-[#E56B6F]"
          >
            Sign out &amp; switch account
          </button>
        </div>
      </div>
    </div>
  );
}

function AppRouter() {
  const { user, profile, loading, isDemoMode, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] dark:bg-slate-950 flex flex-col items-center justify-center gap-4 p-6">
        <BrandLogo size="lg" showTagline />
        <p className="text-xs font-medium text-[#8490A5]">Loading your FinTrack Campus workspace...</p>
      </div>
    );
  }

  if (!user && isDemoMode) {
    return <DashboardShell isDemo />;
  }

  if (!user) {
    return <LandingView />;
  }

  if (!user.emailVerified) {
    return <EmailVerificationGate />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] dark:bg-slate-950 flex flex-col items-center justify-center gap-4 p-6">
        <BrandLogo size="lg" showTagline />
        <p className="text-xs font-medium text-[#8490A5]">Preparing your student profile...</p>
      </div>
    );
  }

  if (!profile.onboardingCompleted) {
    return <OnboardingFlow profile={profile} onSignOut={logout} />;
  }

  return <DashboardShell />;
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
