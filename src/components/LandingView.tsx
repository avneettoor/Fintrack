import { useState } from 'react';
import { ArrowRight, Check, GraduationCap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

export function LandingView() {
  const { signInWithGoogle, signingIn, authError, clearAuthError } = useAuth();
  const [imageError, setImageError] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar Contract: 3 exact zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            FinTrack Campus
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a
              href="#features"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Expense Tracker
            </a>
            <a
              href="#features"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Budget Planner
            </a>
            <a
              href="#features"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Savings Goals
            </a>
            <a
              href="#plans"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Campus Plan
            </a>
          </nav>

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={signingIn}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            <GoogleMark />
            <span>{signingIn ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Hero Split */}
        <section className="max-w-6xl mx-auto px-6 pt-12 pb-16 lg:pt-16 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-medium text-teal-800 tracking-normal">
                Dehradun Campus Finance · Built for 18–25 College Allowances
              </p>

              <h1
                className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1]"
                style={{ textWrap: 'balance' }}
              >
                Know where every rupee goes before the 20th of the month.
              </h1>

              <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Stop piecing together scattered UPI histories and rough phone notes. Log daily canteen,
                auto, and hostel expenses in seconds, set real category limits, and protect your
                monthly allowance.
              </p>

              {authError && (
                <div
                  role="alert"
                  className="mt-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between gap-3 text-sm text-red-800"
                >
                  <span>{authError}</span>
                  <button
                    type="button"
                    onClick={clearAuthError}
                    className="text-xs font-medium underline whitespace-nowrap shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={signingIn}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                >
                  <GoogleMark />
                  <span>{signingIn ? 'Connecting Google Account...' : 'Continue with Google'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="#plans"
                  className="inline-flex items-center px-4 py-3 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Compare Free &amp; Rs. 49 Plans
                </a>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                  Private per-student Google sync
                </span>
                <span aria-hidden="true">·</span>
                <span>No bank password required</span>
                <span aria-hidden="true">·</span>
                <span>Sample month included on sign-in</span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[320px] rounded-xl overflow-hidden border border-slate-200 bg-slate-200">
                {!imageError ? (
                  <img
                    src="/src/assets/images/campus_student_study_1795194733165.jpg"
                    alt="College students reviewing monthly expenses and study notes together on a sunny campus"
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                    className="w-full h-full lg:h-full object-cover aspect-[4/3]"
                  />
                ) : (
                  <div className="w-full h-full min-h-[320px] bg-gradient-to-br from-teal-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-8 text-white">
                    <GraduationCap className="w-10 h-10 text-teal-300 mb-3" />
                    <p className="font-display text-lg font-semibold">FinTrack Campus</p>
                    <p className="text-sm text-slate-300 mt-1">Student Allowance &amp; Expense Control</p>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/55 to-transparent p-6 pt-16 text-white">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-xs text-teal-200">Monthly Allowance Example</p>
                      <p className="font-mono-nums text-2xl font-semibold mt-0.5">Rs. 8,000 / month</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-300">Safe-to-Spend Today</p>
                      <p className="font-mono-nums text-lg font-semibold text-emerald-300 mt-0.5">
                        Rs. 266 / day
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Mechanisms Strip */}
        <section id="features" className="border-t border-slate-200 bg-white py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-teal-800">Core MVP Capabilities</p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-slate-900">
                Built around student UPI habits, not corporate accounting
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50">
                <p className="text-xs font-medium text-slate-500">01 · Expense Tracker</p>
                <h3 className="mt-2 font-display text-lg font-semibold text-slate-900">
                  10-second daily UPI &amp; cash logging
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Capture Rs. 20 chai, Rs. 40 shared autos, canteen meals, and subscriptions before small
                  transactions quietly eat your allowance.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50">
                <p className="text-xs font-medium text-slate-500">02 · Student Budget Planner</p>
                <h3 className="mt-2 font-display text-lg font-semibold text-slate-900">
                  Live Safe-to-Spend daily guide
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Split your monthly allowance across Food, Transport, Campus, and Hangouts with clear
                  warnings before any category runs dry.
                </p>
              </div>

              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50">
                <p className="text-xs font-medium text-slate-500">03 · Goals &amp; Challenges</p>
                <h3 className="mt-2 font-display text-lg font-semibold text-slate-900">
                  Save for trips, books &amp; emergencies
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Set dedicated campus savings targets and run 7-day no-delivery or daily-logging
                  challenges to build lasting money habits.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Transparent Pricing / Freemium Plan Section */}
        <section id="plans" className="border-t border-slate-200 bg-slate-50 py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-teal-800">Student-First Pricing</p>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-slate-900">
                Start free, upgrade only if you want deeper habit tools
              </h2>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <div className="p-7 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">For Every College Student</p>
                  <h3 className="mt-1 font-display text-xl font-bold text-slate-900">Free Core Plan</h3>
                  <p className="mt-3 font-mono-nums text-3xl font-bold text-slate-900">
                    Rs. 0 <span className="text-sm font-normal text-slate-500">/ month</span>
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                      <span>Unlimited daily UPI, cash, and card expense entries</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                      <span>8 student category budget caps &amp; Safe-to-Spend meter</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                      <span>Savings goals, habit challenges &amp; CSV export</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={signingIn}
                  className="mt-8 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  <GoogleMark />
                  <span>Start Free with Google</span>
                </button>
              </div>

              <div className="p-7 rounded-xl border border-slate-300 bg-white flex flex-col justify-between">
                <div>
                  <p className="text-xs font-medium text-teal-800">For Habit Builders &amp; Hostelers</p>
                  <h3 className="mt-1 font-display text-xl font-bold text-slate-900">Campus Plus</h3>
                  <p className="mt-3 font-mono-nums text-3xl font-bold text-slate-900">
                    Rs. 49 <span className="text-sm font-normal text-slate-500">/ month</span>
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-600">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                      <span>Everything in Free Core Plan</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                      <span>Month-end spend velocity projections &amp; category leak alerts</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                      <span>Priority early access to campus partner student perks</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={signingIn}
                  className="mt-8 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  <span>Sign in to Preview Campus Plus</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>FinTrack Campus · Student Personal Finance MVP</span>
          <span>Dehradun, Uttarakhand · Built for simple college budgeting</span>
        </div>
      </footer>
    </div>
  );
}
