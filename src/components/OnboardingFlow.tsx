import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { completeOnboarding, seedDemoCampusData } from '../lib/fintrackService';
import {
  AgeGroup,
  CurrencyCode,
  getCurrentMonthKey,
  MAX_AMOUNT,
  MAX_CAMPUS_NAME_LENGTH,
  UserProfile,
} from '../types/finance';
import { BrandLogo } from './BrandLogo';

interface OnboardingFlowProps {
  profile: UserProfile;
  onSignOut: () => Promise<void>;
}

export function OnboardingFlow({ profile, onSignOut }: OnboardingFlowProps) {
  const [monthlyAllowance, setMonthlyAllowance] = useState(String(profile.monthlyAllowance || 20000));
  const [monthlyBudget, setMonthlyBudget] = useState(String(profile.monthlyBudget || 15000));
  const [savingsTarget, setSavingsTarget] = useState(String(profile.savingsTarget || 5000));
  const [campusName, setCampusName] = useState(profile.campusName || 'DBS Global University, Dehradun');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(profile.ageGroup || '18-20');
  const [currency, setCurrency] = useState<CurrencyCode>(profile.currency || 'INR');
  const [loadDemoData, setLoadDemoData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await completeOnboarding(profile.uid, {
        campusName,
        ageGroup,
        currency,
        monthlyAllowance: Math.min(MAX_AMOUNT, Math.max(0, Number(monthlyAllowance) || 0)),
        monthlyBudget: Math.min(MAX_AMOUNT, Math.max(0, Number(monthlyBudget) || 0)),
        savingsTarget: Math.min(MAX_AMOUNT, Math.max(0, Number(savingsTarget) || 0)),
      });
      if (loadDemoData) {
        await seedDemoCampusData(profile.uid, getCurrentMonthKey());
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="max-w-2xl w-full mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <BrandLogo size="md" showTagline />
          <button
            type="button"
            onClick={onSignOut}
            className="text-xs font-medium text-[#8490A5] hover:text-[#172B4D] dark:hover:text-white"
          >
            Sign out
          </button>
        </div>

        <div className="mt-6">
          <p className="text-xs font-semibold text-[#18A879]">Step 1 of 1 · Personalize Your Workspace</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#172B4D] dark:text-white">
            Welcome, {profile.displayName}. Let&apos;s set up your monthly plan.
          </h1>
          <p className="mt-1.5 text-sm text-[#8490A5] dark:text-slate-400">
            Configure your allowance, spending cap, and savings goal so your dashboard calculates
            your Daily Safe-to-Spend accurately.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="ob-allowance" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
                Monthly Allowance / Income
              </label>
              <input
                id="ob-allowance"
                type="number"
                min="0"
                max={MAX_AMOUNT}
                value={monthlyAllowance}
                onChange={(e) => setMonthlyAllowance(e.target.value)}
                required
                className="mt-1.5 w-full px-3.5 py-2.5 text-sm font-mono-nums border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#18A879]"
              />
            </div>

            <div>
              <label htmlFor="ob-budget" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
                Monthly Spending Budget
              </label>
              <input
                id="ob-budget"
                type="number"
                min="0"
                max={MAX_AMOUNT}
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                required
                className="mt-1.5 w-full px-3.5 py-2.5 text-sm font-mono-nums border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#18A879]"
              />
            </div>

            <div>
              <label htmlFor="ob-savings" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
                Monthly Savings Target
              </label>
              <input
                id="ob-savings"
                type="number"
                min="0"
                max={MAX_AMOUNT}
                value={savingsTarget}
                onChange={(e) => setSavingsTarget(e.target.value)}
                required
                className="mt-1.5 w-full px-3.5 py-2.5 text-sm font-mono-nums border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#18A879]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="ob-campus" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
                College / University Name
              </label>
              <input
                id="ob-campus"
                type="text"
                maxLength={MAX_CAMPUS_NAME_LENGTH}
                value={campusName}
                onChange={(e) => setCampusName(e.target.value)}
                required
                className="mt-1.5 w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#18A879]"
              />
            </div>

            <div>
              <label htmlFor="ob-currency" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
                Preferred Currency
              </label>
              <select
                id="ob-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="mt-1.5 w-full px-3.5 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#18A879]"
              >
                <option value="INR">Indian Rupee (₹ INR)</option>
                <option value="USD">US Dollar ($ USD)</option>
                <option value="EUR">Euro (€ EUR)</option>
              </select>
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-[#253047] dark:text-slate-300 mb-1.5">
              Student Age Group
            </span>
            <div className="grid grid-cols-4 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {(['18-20', '21-22', '23-25', '25+'] as AgeGroup[]).map((ag) => (
                <button
                  key={ag}
                  type="button"
                  onClick={() => setAgeGroup(ag)}
                  className={`py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    ageGroup === ag
                      ? 'bg-white dark:bg-slate-700 text-[#172B4D] dark:text-white shadow-sm'
                      : 'text-[#8490A5] hover:text-[#172B4D] dark:hover:text-white'
                  }`}
                >
                  {ag}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F7F9FC] dark:bg-slate-800/60 cursor-pointer">
            <input
              type="checkbox"
              checked={loadDemoData}
              onChange={(e) => setLoadDemoData(e.target.checked)}
              className="mt-1 w-4 h-4 accent-[#18A879] rounded"
            />
            <div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#172B4D] dark:text-white">
                <Sparkles className="w-4 h-4 text-[#18A879]" />
                Populate sample student month (₹20,000 income, ₹7,500 expenses, ₹12,500 balance)
              </span>
              <p className="mt-0.5 text-xs text-[#8490A5] dark:text-slate-400">
                Uncheck if you prefer to start with a completely empty account and enter your own
                transactions from scratch.
              </p>
            </div>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-[#18A879] hover:bg-[#149369] disabled:opacity-60 rounded-xl transition-colors whitespace-nowrap"
          >
            <span>{submitting ? 'Setting up your dashboard...' : 'Launch My Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
