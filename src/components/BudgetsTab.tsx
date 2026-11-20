import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import {
  CATEGORIES,
  CategoryBudget,
  Expense,
  ExpenseCategory,
  formatINR,
  formatMonthLabel,
  MAX_ALLOWANCE_AMOUNT,
} from '../types/finance';

interface BudgetsTabProps {
  monthKey: string;
  monthlyAllowance: number;
  expenses: Expense[];
  budgets: CategoryBudget[];
  onSaveMonthlyAllowance: (nextAllowance: number) => Promise<void>;
  onSaveCategoryBudget: (category: ExpenseCategory, limitAmount: number) => Promise<void>;
}

export function BudgetsTab({
  monthKey,
  monthlyAllowance,
  expenses,
  budgets,
  onSaveMonthlyAllowance,
  onSaveCategoryBudget,
}: BudgetsTabProps) {
  const [allowanceInput, setAllowanceInput] = useState(String(monthlyAllowance));
  const [savingAllowance, setSavingAllowance] = useState(false);
  const [allowanceSaved, setAllowanceSaved] = useState(false);

  const [draftCaps, setDraftCaps] = useState<Record<string, string>>({});
  const [savingCat, setSavingCat] = useState<string | null>(null);
  const [savedCat, setSavedCat] = useState<string | null>(null);

  useEffect(() => {
    setAllowanceInput(String(monthlyAllowance));
  }, [monthlyAllowance]);

  useEffect(() => {
    const map: Record<string, string> = {};
    const monthBudgets = budgets.filter((b) => b.monthKey === monthKey);
    for (const cat of CATEGORIES) {
      const found = monthBudgets.find((b) => b.category === cat.id);
      map[cat.id] = String(found ? found.limitAmount : cat.defaultCap);
    }
    setDraftCaps(map);
  }, [budgets, monthKey]);

  const monthExpenses = expenses.filter((e) => e.monthKey === monthKey);
  const spendByCat = new Map<string, number>();
  monthExpenses.forEach((e) => {
    spendByCat.set(e.category, (spendByCat.get(e.category) || 0) + e.amount);
  });

  const totalAllocated = CATEGORIES.reduce((sum, cat) => {
    const val = Number(draftCaps[cat.id] ?? cat.defaultCap);
    return sum + (Number.isFinite(val) ? val : 0);
  }, 0);

  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const unallocatedBuffer = monthlyAllowance - totalAllocated;

  const handleAllowanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(allowanceInput);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > MAX_ALLOWANCE_AMOUNT) return;
    setSavingAllowance(true);
    try {
      await onSaveMonthlyAllowance(numeric);
      setAllowanceSaved(true);
      setTimeout(() => setAllowanceSaved(false), 2000);
    } finally {
      setSavingAllowance(false);
    }
  };

  const handleSaveCap = async (category: ExpenseCategory) => {
    const numeric = Number(draftCaps[category] ?? 0);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > MAX_ALLOWANCE_AMOUNT) return;
    setSavingCat(category);
    try {
      await onSaveCategoryBudget(category, numeric);
      setSavedCat(category);
      setTimeout(() => setSavedCat(null), 1800);
    } finally {
      setSavingCat(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Allowance Allocation Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <form onSubmit={handleAllowanceSubmit} className="lg:col-span-5 space-y-2">
          <label htmlFor="monthly-allowance" className="block text-xs font-medium text-slate-500">
            Total Monthly Allowance (INR)
          </label>
          <div className="flex items-center gap-2.5">
            <input
              id="monthly-allowance"
              type="number"
              min="0"
              max={MAX_ALLOWANCE_AMOUNT}
              value={allowanceInput}
              onChange={(e) => setAllowanceInput(e.target.value)}
              className="w-40 px-3.5 py-2 font-mono-nums text-base font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <button
              type="submit"
              disabled={savingAllowance}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
            >
              {allowanceSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved</span>
                </>
              ) : (
                <span>{savingAllowance ? 'Saving...' : 'Update Allowance'}</span>
              )}
            </button>
          </div>
        </form>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6">
          <div>
            <p className="text-xs text-slate-500">Allocated to Categories</p>
            <p className="mt-1 font-mono-nums text-lg font-bold text-slate-900">
              {formatINR(totalAllocated)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Spent in {formatMonthLabel(monthKey)}</p>
            <p className="mt-1 font-mono-nums text-lg font-bold text-slate-900">
              {formatINR(totalSpent)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Unallocated Buffer</p>
            <p
              className={`mt-1 font-mono-nums text-lg font-bold ${
                unallocatedBuffer < 0 ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              {formatINR(unallocatedBuffer)}
            </p>
          </div>
        </div>
      </div>

      {/* Category Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => {
          const spent = spendByCat.get(cat.id) || 0;
          const cap = Number(draftCaps[cat.id] ?? cat.defaultCap);
          const pct = cap > 0 ? Math.round((spent / cap) * 100) : 0;
          const over = cap > 0 && spent > cap;
          const warn = !over && cap > 0 && spent >= cap * 0.8;
          const statusLabel = over ? 'Over Cap' : warn ? 'Near Cap' : 'On Track';
          const statusColor = over
            ? 'text-red-700'
            : warn
              ? 'text-amber-700'
              : 'text-emerald-700';
          const barColor = over ? '#DC2626' : warn ? '#D97706' : '#0F766E';

          return (
            <div key={cat.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-900">{cat.label}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{cat.examples}</p>
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${statusColor}`}>
                  {statusLabel} · <span className="font-mono-nums">{pct}%</span>
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                  <span>
                    Spent: <strong className="font-mono-nums text-slate-900">{formatINR(spent)}</strong>
                  </span>
                  <span>
                    Remaining:{' '}
                    <strong className="font-mono-nums text-slate-900">
                      {formatINR(Math.max(0, cap - spent))}
                    </strong>
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-3">
                <label htmlFor={`cap-${cat.id}`} className="text-xs font-medium text-slate-600">
                  Monthly Cap (INR)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`cap-${cat.id}`}
                    type="number"
                    min="0"
                    max={MAX_ALLOWANCE_AMOUNT}
                    value={draftCaps[cat.id] ?? ''}
                    onChange={(e) =>
                      setDraftCaps((prev) => ({ ...prev, [cat.id]: e.target.value }))
                    }
                    className="w-28 px-3 py-1.5 font-mono-nums text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveCap(cat.id)}
                    disabled={savingCat === cat.id}
                    className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
                  >
                    {savedCat === cat.id ? 'Saved' : savingCat === cat.id ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
