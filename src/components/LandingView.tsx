import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  PieChart as PieChartIcon,
  PiggyBank,
  Play,
  ShieldCheck,
  Target,
  Trophy,
  Wallet,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { AuthModal, AuthModalMode } from './AuthModal';
import { BrandLogo } from './BrandLogo';

const PREVIEW_CATEGORIES = [
  { name: 'Food & Dining', value: 2500, color: '#18A879' },
  { name: 'Shopping', value: 1500, color: '#E56B6F' },
  { name: 'Transportation', value: 1200, color: '#4778E8' },
  { name: 'Education', value: 1000, color: '#6366F1' },
  { name: 'Entertainment', value: 800, color: '#F4B544' },
  { name: 'Other', value: 500, color: '#64748B' },
];

const FAQS = [
  {
    q: 'Does FinTrack Campus require my bank password or UPI PIN?',
    a: 'No. FinTrack Campus never asks for bank credentials or UPI PINs. You log expenses manually in under 10 seconds with full control over your privacy.',
  },
  {
    q: 'Why is it built specifically for Indian college students?',
    a: 'Students aged 18–25 manage fixed monthly allowances and frequent small UPI spends across food, shared autos, hostel fees, and books. Existing finance tools are built for salaried corporate professionals.',
  },
  {
    q: 'How is Daily Safe-to-Spend calculated?',
    a: 'We subtract your current month expenses from your monthly budget and divide by the remaining days in the month so you always know what you can safely spend today.',
  },
  {
    q: 'Can I start completely free?',
    a: 'Yes. The Free Plan covers expense & income tracking, wallets, monthly budgeting, savings goals, and financial education at ₹0/month. Campus Plus starts at ₹49/month.',
  },
];

export function LandingView() {
  const { signInWithGoogle, signingIn, authError, clearAuthError, enterDemoMode } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthModalMode>('signup');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [heroImgError, setHeroImgError] = useState(false);
  const [billingTest, setBillingTest] = useState<'49' | '59' | 'annual'>('49');

  const openAuth = (mode: AuthModalMode) => {
    clearAuthError();
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#253047] flex flex-col">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <a href="#top" className="whitespace-nowrap shrink-0">
            <BrandLogo size="md" />
          </a>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#253047]">
            <a href="#why" className="hover:text-[#18A879] hover:underline underline-offset-4 whitespace-nowrap shrink-0">
              Features
            </a>
            <a href="#budgeting" className="hover:text-[#18A879] hover:underline underline-offset-4 whitespace-nowrap shrink-0">
              Budgeting
            </a>
            <a href="#challenges" className="hover:text-[#18A879] hover:underline underline-offset-4 whitespace-nowrap shrink-0">
              Challenges
            </a>
            <a href="#learn" className="hover:text-[#18A879] hover:underline underline-offset-4 whitespace-nowrap shrink-0">
              Learn Finance
            </a>
            <a href="#pricing" className="hover:text-[#18A879] hover:underline underline-offset-4 whitespace-nowrap shrink-0">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={enterDemoMode}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-[#172B4D] bg-white border border-slate-200 hover:border-[#18A879] hover:text-[#18A879] rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Try Demo</span>
            </button>
            <button
              type="button"
              onClick={() => openAuth('signup')}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#18A879] hover:bg-[#149369] rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* 1. Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-16 lg:pt-16 lg:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-semibold text-[#18A879]">
                Your Money. Your Control. Your Future. · Built for Indian Students
              </p>

              <h1
                className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#172B4D] leading-[1.1]"
                style={{ textWrap: 'balance' }}
              >
                Take Control of Your Money. Build Better Financial Habits.
              </h1>

              <p className="mt-5 text-base sm:text-lg text-[#253047]/80 leading-relaxed max-w-xl">
                FinTrack Campus helps students track expenses, manage monthly budgets, achieve
                savings goals and become financially independent.
              </p>

              {authError && (
                <div
                  role="alert"
                  className="mt-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start justify-between gap-3 text-xs text-red-800"
                >
                  <span>{authError}</span>
                  <button
                    type="button"
                    onClick={clearAuthError}
                    className="font-semibold underline whitespace-nowrap shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => openAuth('signup')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#18A879] hover:bg-[#149369] rounded-xl transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={enterDemoMode}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#172B4D] hover:bg-[#10203a] rounded-xl transition-colors whitespace-nowrap shrink-0"
                >
                  <Play className="w-3.5 h-3.5 text-[#18A879]" />
                  <span>Try Interactive Demo</span>
                </button>

                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={signingIn}
                  className="text-sm font-semibold text-[#172B4D] hover:text-[#18A879] underline underline-offset-4 whitespace-nowrap"
                >
                  {signingIn ? 'Signing in...' : 'Quick Google Sign-In'}
                </button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-[#8490A5]">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#18A879]" />
                  Private student ledger in ₹ INR
                </span>
                <span aria-hidden="true">·</span>
                <span>Launching in Dehradun, Uttarakhand</span>
                <span aria-hidden="true">·</span>
                <span>Log in seconds</span>
              </div>
            </div>

            {/* Interactive Spendee-Inspired Preview Card */}
            <div className="lg:col-span-6">
              <div className="h-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-5">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-xs font-medium text-[#8490A5]">Sample Student Overview</p>
                    <p className="font-display text-lg font-bold text-[#172B4D] mt-0.5">
                      Total Balance: <span className="font-mono-nums text-[#16A36A]">₹12,500</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#8490A5]">Safe-to-Spend Today</p>
                    <p className="font-mono-nums text-base font-bold text-[#18A879]">₹250 / day</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={PREVIEW_CATEGORIES}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={48}
                          outerRadius={74}
                          paddingAngle={3}
                        >
                          {PREVIEW_CATEGORIES.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: unknown) => `₹${Number(val).toLocaleString('en-IN')}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2.5">
                    {PREVIEW_CATEGORIES.map((c) => (
                      <div key={c.name} className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-2 text-[#253047]">
                          <span
                            className="w-2.5 h-2.5 rounded-xs shrink-0"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.name}
                        </span>
                        <span className="font-mono-nums font-semibold text-[#172B4D]">
                          ₹{c.value.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-[#F7F9FC]">
                    <p className="text-[11px] text-[#8490A5]">Monthly Income</p>
                    <p className="font-mono-nums text-sm font-bold text-[#16A36A] mt-0.5">₹20,000</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F7F9FC]">
                    <p className="text-[11px] text-[#8490A5]">Monthly Expenses</p>
                    <p className="font-mono-nums text-sm font-bold text-[#E56B6F] mt-0.5">₹7,500</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#F7F9FC]">
                    <p className="text-[11px] text-[#8490A5]">Laptop Goal</p>
                    <p className="font-mono-nums text-sm font-bold text-[#4778E8] mt-0.5">30%</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={enterDemoMode}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#F7F9FC] hover:bg-emerald-50 border border-slate-200 hover:border-[#18A879]/40 text-xs font-semibold text-[#172B4D] hover:text-[#18A879] flex items-center justify-center gap-2 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-[#18A879]" />
                  <span>Open Full Interactive Demo (No Login Required)</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Why FinTrack Campus */}
        <section id="why" className="bg-white border-t border-slate-200 py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5">
                <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-[4/3] bg-slate-100">
                  {!heroImgError ? (
                    <img
                      src="/src/assets/images/campus_student_study_1795194733165.jpg"
                      alt="College students managing their monthly campus allowance together"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#172B4D] text-white flex flex-col items-center justify-center p-6 text-center">
                      <Wallet className="w-10 h-10 text-[#18A879] mb-2" />
                      <p className="font-display font-bold">Built for Campus Life</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-7">
                <p className="text-xs font-semibold text-[#18A879]">Why FinTrack Campus?</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-[#172B4D]">
                  Clarity within five seconds of opening your dashboard
                </h2>
                <p className="mt-3 text-sm sm:text-base text-[#253047]/80 leading-relaxed">
                  Students living away from home often lose track of ₹30 chai, ₹60 autos, and
                  late-night food orders until their allowance runs out mid-month. FinTrack Campus
                  turns scattered spends into five instant answers.
                </p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    'How much money do I have across UPI, cash & bank?',
                    'How much have I spent this week and month?',
                    'How much can I safely spend today without running dry?',
                    'Where is my money leaking & how much have I saved?',
                  ].map((point) => (
                    <div key={point} className="p-4 rounded-xl bg-[#F7F9FC] border border-slate-200 text-sm font-medium text-[#172B4D]">
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. How It Works */}
        <section className="py-16 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-xs font-semibold text-[#18A879]">How It Works</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-[#172B4D]">
              Three steps from allowance day to month-end surplus
            </h2>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: '01. Set Allowance & Wallets',
                  desc: 'Enter your monthly allowance, spending cap, and wallets (UPI, Cash, Bank, Savings) during quick onboarding.',
                },
                {
                  step: '02. Log Daily UPI & Cash',
                  desc: 'Use the floating + button to record food, travel, books, or transfers between wallets in seconds.',
                },
                {
                  step: '03. Follow Safe-to-Spend',
                  desc: 'Watch live category meters, unlock badges via challenges, and keep your savings goals on schedule.',
                },
              ].map((item) => (
                <div key={item.step} className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="font-display text-lg font-bold text-[#172B4D]">{item.step}</h3>
                  <p className="mt-2 text-sm text-[#8490A5] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4, 5, 6, 7, 8 Feature Showcase Grid */}
        <section id="budgeting" className="bg-white border-t border-slate-200 py-16">
          <div className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold text-[#18A879]">Complete Student Finance Suite</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-[#172B4D]">
                Everything you need to manage college finances cleanly
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-slate-200 bg-[#F7F9FC]">
                <Wallet className="w-6 h-6 text-[#18A879]" />
                <h3 className="mt-4 font-display text-lg font-bold text-[#172B4D]">
                  Expense Tracking &amp; Wallets
                </h3>
                <p className="mt-2 text-sm text-[#253047]/80 leading-relaxed">
                  Track expenses, income, and wallet-to-wallet transfers across UPI, Cash, Bank, and
                  Savings wallets with CSV exports and receipt notes.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200 bg-[#F7F9FC]">
                <PieChartIcon className="w-6 h-6 text-[#4778E8]" />
                <h3 className="mt-4 font-display text-lg font-bold text-[#172B4D]">
                  Smart Budgeting &amp; Alerts
                </h3>
                <p className="mt-2 text-sm text-[#253047]/80 leading-relaxed">
                  Set category-wise caps across 10 student categories with automatic 70%, 90%, and
                  100% consumption alerts plus Daily Safe-to-Spend.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200 bg-[#F7F9FC]">
                <Target className="w-6 h-6 text-[#16A36A]" />
                <h3 className="mt-4 font-display text-lg font-bold text-[#172B4D]">
                  Savings Goals
                </h3>
                <p className="mt-2 text-sm text-[#253047]/80 leading-relaxed">
                  Save toward a new laptop, smartphone, college trip, or emergency cushion with
                  dedicated deposits, withdrawals, and target dates.
                </p>
              </div>

              <div id="challenges" className="p-6 rounded-2xl border border-slate-200 bg-[#F7F9FC]">
                <Trophy className="w-6 h-6 text-[#F4B544]" />
                <h3 className="mt-4 font-display text-lg font-bold text-[#172B4D]">
                  Money Challenges &amp; Badges
                </h3>
                <p className="mt-2 text-sm text-[#253047]/80 leading-relaxed">
                  Join No-Spend Weekends, 30-Day Expense Tracking streaks, and ₹50/day savings
                  sprints to earn discipline points and achievement badges.
                </p>
              </div>

              <div id="learn" className="p-6 rounded-2xl border border-slate-200 bg-[#F7F9FC]">
                <BookOpen className="w-6 h-6 text-[#172B4D]" />
                <h3 className="mt-4 font-display text-lg font-bold text-[#172B4D]">
                  Student Financial Education
                </h3>
                <p className="mt-2 text-sm text-[#253047]/80 leading-relaxed">
                  Bite-sized guides on Needs vs Wants, UPI spending psychology, emergency funds, and
                  compound interest with reading progress tracking.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200 bg-[#F7F9FC]">
                <PiggyBank className="w-6 h-6 text-[#E56B6F]" />
                <h3 className="mt-4 font-display text-lg font-bold text-[#172B4D]">
                  Analytics &amp; Insights
                </h3>
                <p className="mt-2 text-sm text-[#253047]/80 leading-relaxed">
                  Interactive Recharts comparisons for Income vs Expenses, weekly patterns,
                  month-over-month shifts, and real savings rate calculation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 9. Pricing */}
        <section id="pricing" className="py-16 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs font-semibold text-[#18A879]">Freemium Pricing</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-[#172B4D]">
                  Priced for a student pocket
                </h2>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
                <button
                  type="button"
                  onClick={() => setBillingTest('49')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    billingTest === '49' ? 'bg-white text-[#172B4D] shadow-sm' : 'text-[#8490A5]'
                  }`}
                >
                  Monthly ₹49
                </button>
                <button
                  type="button"
                  onClick={() => setBillingTest('59')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    billingTest === '59' ? 'bg-white text-[#172B4D] shadow-sm' : 'text-[#8490A5]'
                  }`}
                >
                  Monthly ₹59
                </button>
                <button
                  type="button"
                  onClick={() => setBillingTest('annual')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    billingTest === 'annual' ? 'bg-white text-[#172B4D] shadow-sm' : 'text-[#8490A5]'
                  }`}
                >
                  Annual ₹499
                </button>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#8490A5]">Free Plan</p>
                  <p className="mt-2 font-mono-nums text-3xl font-bold text-[#172B4D]">
                    ₹0 <span className="text-sm font-normal text-[#8490A5]">/ month</span>
                  </p>
                  <ul className="mt-6 space-y-2.5 text-sm text-[#253047]">
                    {[
                      'Manual expense & income tracking',
                      'Basic monthly budget & Safe-to-Spend',
                      'Core expense categories',
                      '1 active savings goal',
                      'Basic financial summary',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#18A879] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => openAuth('signup')}
                  className="mt-8 w-full py-2.5 text-sm font-semibold text-[#172B4D] bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Get Started Free
                </button>
              </div>

              <div className="bg-white border-2 border-[#18A879] rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#18A879]">Premium Monthly</p>
                  <p className="mt-2 font-mono-nums text-3xl font-bold text-[#172B4D]">
                    ₹{billingTest === '59' ? '59' : '49'}{' '}
                    <span className="text-sm font-normal text-[#8490A5]">/ month</span>
                  </p>
                  <ul className="mt-6 space-y-2.5 text-sm text-[#253047]">
                    {[
                      'Advanced financial analytics & trends',
                      'Unlimited savings goals & wallets',
                      'Unlimited category budgets & alerts',
                      'Advanced challenges & custom reports',
                      'CSV and Excel-ready exports',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#18A879] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => openAuth('signup')}
                  className="mt-8 w-full py-2.5 text-sm font-semibold text-white bg-[#18A879] hover:bg-[#149369] rounded-xl transition-colors"
                >
                  Start Free &amp; Preview Premium
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#4778E8]">Premium Annual</p>
                  <p className="mt-2 font-mono-nums text-3xl font-bold text-[#172B4D]">
                    ₹499 <span className="text-sm font-normal text-[#8490A5]">/ year</span>
                  </p>
                  <ul className="mt-6 space-y-2.5 text-sm text-[#253047]">
                    {[
                      'All Premium Monthly features unlocked',
                      '2 months free vs monthly billing',
                      'Full academic year budget history',
                      'Priority student feature requests',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#4778E8] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => openAuth('signup')}
                  className="mt-8 w-full py-2.5 text-sm font-semibold text-white bg-[#172B4D] hover:bg-[#10203a] rounded-xl transition-colors"
                >
                  Choose Annual Preview
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 10. FAQ */}
        <section className="bg-white border-t border-slate-200 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="font-display text-3xl font-bold text-[#172B4D]">
              Frequently Asked Questions
            </h2>
            <div className="mt-8 divide-y divide-slate-200 border-t border-b border-slate-200">
              {FAQS.map((item, idx) => {
                const open = openFaq === idx;
                return (
                  <div key={item.q} className="py-4">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : idx)}
                      className="w-full flex items-center justify-between gap-4 text-left font-display text-base font-semibold text-[#172B4D]"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {open && (
                      <p className="mt-2 text-sm text-[#8490A5] leading-relaxed">{item.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* 11. Footer */}
      <footer className="border-t border-slate-200 bg-[#172B4D] text-white py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-display text-lg font-bold">
              FinTrack <span className="text-[#18A879]">Campus</span>
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Your Money. Your Control. Your Future. · Dehradun, Uttarakhand
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300">
            <button type="button" onClick={enterDemoMode} className="text-[#18A879] font-semibold hover:underline">
              Try Live Demo
            </button>
            <button type="button" onClick={() => openAuth('login')} className="hover:text-white">
              Log In
            </button>
            <button type="button" onClick={() => openAuth('signup')} className="hover:text-white">
              Sign Up Free
            </button>
            <a href="#pricing" className="hover:text-white">
              Pricing
            </a>
            <span>Educational tools only, not investment advice</span>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
