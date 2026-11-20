import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AgeGroup, MAX_CAMPUS_NAME_LENGTH, MAX_DISPLAY_NAME_LENGTH } from '../types/finance';
import { BrandLogo } from './BrandLogo';

export type AuthModalMode = 'login' | 'signup' | 'forgot';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: AuthModalMode;
  onClose: () => void;
}

function GoogleMark() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
      />
    </svg>
  );
}

export function AuthModal({ isOpen, initialMode, onClose }: AuthModalProps) {
  const {
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    sendResetPasswordEmail,
    signingIn,
    authError,
    clearAuthError,
  } = useAuth();

  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [campusName, setCampusName] = useState('DBS Global University, Dehradun');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('18-20');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setResetSent(false);
      clearAuthError();
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      const ok = await signInWithEmail(email, password);
      if (ok) onClose();
    } else if (mode === 'signup') {
      const ok = await signUpWithEmail({
        fullName,
        email,
        password,
        campusName,
        ageGroup,
      });
      if (ok) onClose();
    } else {
      const ok = await sendResetPasswordEmail(email);
      if (ok) setResetSent(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <BrandLogo size="sm" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication modal"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5">
          <h2 id="auth-modal-title" className="font-display text-xl font-bold text-[#172B4D]">
            {mode === 'login'
              ? 'Welcome back'
              : mode === 'signup'
                ? 'Create your student account'
                : 'Reset your password'}
          </h2>
          <p className="mt-1 text-xs text-[#8490A5]">
            {mode === 'login'
              ? 'Sign in to access your FinTrack Campus wallets and budgets.'
              : mode === 'signup'
                ? 'Start tracking daily UPI spends and monthly allowances in ₹.'
                : 'Enter your registered email to receive a password reset link.'}
          </p>
        </div>

        {/* Google Auth Button */}
        {mode !== 'forgot' && (
          <div className="mt-5">
            <button
              type="button"
              onClick={async () => {
                await signInWithGoogle();
              }}
              disabled={signingIn}
              className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-[#172B4D] bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-60 rounded-xl transition-colors whitespace-nowrap"
            >
              <GoogleMark />
              <span>{signingIn ? 'Connecting Google...' : 'Continue with Google'}</span>
            </button>

            <div className="relative my-5 flex items-center">
              <div className="flex-1 border-t border-slate-200" />
              <span className="px-3 text-xs text-[#8490A5]">or with email</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>
          </div>
        )}

        {authError && (
          <div
            role="alert"
            className="mb-4 p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl leading-relaxed"
          >
            {authError}
          </div>
        )}

        {resetSent && mode === 'forgot' && (
          <div className="mb-4 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl">
            Password reset link sent to <strong>{email}</strong>. Check your inbox.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-fullname" className="block text-xs font-medium text-[#253047]">
                Full Name
              </label>
              <input
                id="auth-fullname"
                type="text"
                maxLength={MAX_DISPLAY_NAME_LENGTH}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Avneet Kaur"
                required
                className="mt-1 w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18A879]"
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-[#253047]">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@college.ac.in"
              required
              className="mt-1 w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18A879]"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="auth-password" className="block text-xs font-medium text-[#253047]">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      clearAuthError();
                    }}
                    className="text-xs font-medium text-[#18A879] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                id="auth-password"
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                className="mt-1 w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18A879]"
              />
            </div>
          )}

          {mode === 'signup' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="auth-campus" className="block text-xs font-medium text-[#253047]">
                  College Name
                </label>
                <input
                  id="auth-campus"
                  type="text"
                  maxLength={MAX_CAMPUS_NAME_LENGTH}
                  value={campusName}
                  onChange={(e) => setCampusName(e.target.value)}
                  required
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#18A879]"
                />
              </div>

              <div>
                <label htmlFor="auth-age" className="block text-xs font-medium text-[#253047]">
                  Age Group
                </label>
                <select
                  id="auth-age"
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#18A879]"
                >
                  <option value="18-20">18–20 years</option>
                  <option value="21-22">21–22 years</option>
                  <option value="23-25">23–25 years</option>
                  <option value="25+">25+ years</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={signingIn}
            className="mt-2 w-full py-2.5 text-sm font-semibold text-white bg-[#18A879] hover:bg-[#149369] disabled:opacity-60 rounded-xl transition-colors whitespace-nowrap"
          >
            {signingIn
              ? 'Please wait...'
              : mode === 'login'
                ? 'Log In'
                : mode === 'signup'
                  ? 'Create Free Account'
                  : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-200 text-center text-xs text-[#8490A5]">
          {mode === 'login' ? (
            <span>
              New to FinTrack Campus?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  clearAuthError();
                }}
                className="font-semibold text-[#172B4D] hover:underline"
              >
                Sign up free
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  clearAuthError();
                }}
                className="font-semibold text-[#172B4D] hover:underline"
              >
                Log in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
