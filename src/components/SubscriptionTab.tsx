import { useState } from 'react';
import { Check } from 'lucide-react';
import { PlanTier } from '../types/finance';

interface SubscriptionTabProps {
  currentPlan: PlanTier;
  onSelectPlan: (
    plan: PlanTier,
    billingCycle: 'none' | 'monthly' | 'annual',
    priceInr: number
  ) => Promise<void>;
}

export function SubscriptionTab({ currentPlan, onSelectPlan }: SubscriptionTabProps) {
  const [monthlyPriceTest, setMonthlyPriceTest] = useState<49 | 59>(49);
  const [updating, setUpdating] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleChoose = async (
    plan: PlanTier,
    cycle: 'none' | 'monthly' | 'annual',
    priceInr: number
  ) => {
    setUpdating(plan);
    setNotice(null);
    try {
      await onSelectPlan(plan, cycle, priceInr);
      setNotice(
        plan === 'free'
          ? 'Your account is set to the Free Plan (₹0/month).'
          : `Saved your preview preference for ${
              plan === 'premium_monthly' ? `Premium Monthly (₹${priceInr}/mo)` : 'Premium Annual (₹499/yr)'
            }. No real payments are charged while payment gateway integration is in preview.`
      );
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <p className="text-xs font-semibold text-[#18A879]">Freemium Subscription Model</p>
          <h2 className="mt-1 font-display text-xl font-bold text-[#172B4D] dark:text-white">
            Choose the FinTrack Campus Plan That Fits Your Semester
          </h2>
          <p className="mt-1 text-xs text-[#8490A5]">
            Core expense tracking and monthly budgeting remain free. Premium previews do not charge
            any card or UPI account.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setMonthlyPriceTest(49)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              monthlyPriceTest === 49
                ? 'bg-white dark:bg-slate-700 text-[#172B4D] dark:text-white shadow-sm'
                : 'text-[#8490A5]'
            }`}
          >
            Test ₹49/mo
          </button>
          <button
            type="button"
            onClick={() => setMonthlyPriceTest(59)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              monthlyPriceTest === 59
                ? 'bg-white dark:bg-slate-700 text-[#172B4D] dark:text-white shadow-sm'
                : 'text-[#8490A5]'
            }`}
          >
            Test ₹59/mo
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-xs font-medium text-emerald-900 dark:text-emerald-200">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Free Plan */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-[#8490A5]">Free Plan</p>
            <p className="mt-2 font-mono-nums text-3xl font-bold text-[#172B4D] dark:text-white">
              ₹0 <span className="text-sm font-normal text-[#8490A5]">/ month</span>
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-[#253047] dark:text-slate-300">
              {[
                'Manual expense & income tracking',
                'Basic monthly budget',
                'Basic dashboard & Safe-to-Spend',
                'Standard expense categories',
                '1 active savings goal',
                'Basic financial summary',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#18A879] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            disabled={updating !== null || currentPlan === 'free'}
            onClick={() => handleChoose('free', 'none', 0)}
            className="mt-8 w-full py-2.5 text-xs font-semibold rounded-xl transition-colors disabled:opacity-60 bg-slate-100 dark:bg-slate-800 text-[#172B4D] dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            {currentPlan === 'free' ? 'Current Plan' : 'Switch to Free'}
          </button>
        </div>

        {/* Premium Monthly */}
        <div className="bg-white dark:bg-slate-900 border-2 border-[#18A879] rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-[#18A879]">Premium Monthly</p>
            <p className="mt-2 font-mono-nums text-3xl font-bold text-[#172B4D] dark:text-white">
              ₹{monthlyPriceTest} <span className="text-sm font-normal text-[#8490A5]">/ month</span>
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-[#253047] dark:text-slate-300">
              {[
                'Advanced financial analytics & trends',
                'Unlimited savings goals & wallets',
                'Unlimited category budgets & alerts',
                'Advanced spending insights',
                'Advanced money challenges',
                'Custom reports & CSV/Excel export',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#18A879] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            disabled={updating !== null}
            onClick={() => handleChoose('premium_monthly', 'monthly', monthlyPriceTest)}
            className="mt-8 w-full py-2.5 text-xs font-semibold text-white bg-[#18A879] hover:bg-[#149369] disabled:opacity-60 rounded-xl transition-colors"
          >
            {currentPlan === 'premium_monthly'
              ? `Selected Preview (₹${monthlyPriceTest}/mo)`
              : `Preview Premium Monthly (₹${monthlyPriceTest}/mo)`}
          </button>
        </div>

        {/* Premium Annual */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div>
            <p className="text-xs font-semibold text-[#4778E8]">Premium Annual · Save 15%</p>
            <p className="mt-2 font-mono-nums text-3xl font-bold text-[#172B4D] dark:text-white">
              ₹499 <span className="text-sm font-normal text-[#8490A5]">/ year</span>
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-[#253047] dark:text-slate-300">
              {[
                'Everything in Premium Monthly',
                'Covers full academic year (12 months)',
                'Unlimited multi-year CSV backups',
                'Early access to student partner perks',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#4778E8] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            disabled={updating !== null}
            onClick={() => handleChoose('premium_annual', 'annual', 499)}
            className="mt-8 w-full py-2.5 text-xs font-semibold text-white bg-[#172B4D] hover:bg-[#10203a] disabled:opacity-60 rounded-xl transition-colors"
          >
            {currentPlan === 'premium_annual'
              ? 'Selected Preview (₹499/yr)'
              : 'Preview Premium Annual (₹499/yr)'}
          </button>
        </div>
      </div>
    </div>
  );
}
