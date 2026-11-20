import React, { useEffect, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import {
  CategoryBudget,
  CurrencyCode,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  formatCurrency,
  formatMonthLabel,
  MAX_AMOUNT,
  Transaction,
} from '../types/finance';

interface BudgetsTabProps {
  monthKey: string;
  currency: CurrencyCode;
  monthlyBudget: number;
  transactions: Transaction[];
  budgets: CategoryBudget[];
  onSaveMonthlyBudget: (nextBudget: number) => Promise<void>;
  onSaveCategoryBudget: (category: ExpenseCategory, limitAmount: number) => Promise<void>;
  onDeleteCategoryBudget: (budgetId: string) => Promise<void>;
}

export function BudgetsTab({
  monthKey,
  currency,
  monthlyBudget,
  transactions,
  budgets,
  onSaveMonthlyBudget,
  onSaveCategoryBudget,
  onDeleteCategoryBudget,
}: BudgetsTabProps) {
  const [monthlyInput, setMonthlyInput] = useState(String(monthlyBudget));
  const [savingMonthly, setSavingMonthly] = useState(false);
  const [savedMonthly, setSavedMonthly] = useState(false);
  const [draftCaps, setDraftCaps] = useState<Record<string, string>>({});
  const [savingCat, setSavingCat] = useState<string | null>(null);
  const [savedCat, setSavedCat] = useState<string | null>(null);

  useEffect(() => {
    setMonthlyInput(String(monthlyBudget));
  }, [monthlyBudget]);

  useEffect(() => {
    const map: Record<string, string> = {};
    const monthBudgets = budgets.filter((b) => b.monthKey === monthKey);
    for (const cat of EXPENSE_CATEGORIES) {
      const found = monthBudgets.find((b) => b.category === cat.id);
      map[cat.id] = found ? String(found.limitAmount) : '';
    }
    setDraftCaps(map);
  }, [budgets, monthKey]);

  const monthExpenses = transactions.filter((t) => t.monthKey === monthKey && t.type === 'expense');
  const spendByCat = new Map<string, number>();
  monthExpenses.forEach((t) => {
    spendByCat.set(t.category, (spendByCat.get(t.category) || 0) + t.amount);
  });

  const activeMonthBudgets = budgets.filter((b) => b.monthKey === monthKey);
  const totalAllocated = activeMonthBudgets.reduce((sum, b) => sum + b.limitAmount, 0);
  const totalSpent = monthExpenses.reduce((sum, t) => sum + t.amount, 0);
  const unallocated = monthlyBudget - totalAllocated;

  const handleMonthlySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(monthlyInput);
    if (!Number.isFinite(num) || num < 0 || num > MAX_AMOUNT) return;
    setSavingMonthly(true);
    try {
      await onSaveMonthlyBudget(num);
      setSavedMonthly(true);
      setTimeout(() => setSavedMonthly(false), 1800);
    } finally {
      setSavingMonthly(false);
    }
  };

  const handleSaveCap = async (cat: ExpenseCategory) => {
    const num = Number(draftCaps[cat] || 0);
    if (!Number.isFinite(num) || num < 0 || num > MAX_AMOUNT) return;
    setSavingCat(cat);
    try {
      await onSaveCategoryBudget(cat, num);
      setSavedCat(cat);
      setTimeout(() => setSavedCat(null), 1600);
    } finally {
      setSavingCat(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Monthly Budget Summary Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center shadow-xs">
        <form onSubmit={handleMonthlySubmit} className="lg:col-span-5 space-y-2">
          <label
            htmlFor="monthly-budget-input"
            className="block text-xs font-medium text-[#8490A5] dark:text-slate-400"
          >
            Overall Monthly Spending Budget ({formatMonthLabel(monthKey)})
          </label>
          <div className="flex items-center gap-2.5">
            <input
              id="monthly-budget-input"
              type="number"
              min="0"
              max={MAX_AMOUNT}
              value={monthlyInput}
              onChange={(e) => setMonthlyInput(e.target.value)}
              className="w-40 px-3.5 py-2 font-mono-nums text-base font-bold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#18A879]"
            />
            <button
              type="submit"
              disabled={savingMonthly}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#18A879] hover:bg-[#149369] disabled:opacity-60 rounded-xl transition-colors whitespace-nowrap"
            >
              {savedMonthly ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved</span>
                </>
              ) : (
                <span>{savingMonthly ? 'Saving...' : 'Set Budget'}</span>
              )}
            </button>
          </div>
        </form>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-6">
          <div>
            <p className="text-xs text-[#8490A5]">Category Allocations</p>
            <p className="mt-1 font-mono-nums text-lg font-bold text-[#172B4D] dark:text-white">
              {formatCurrency(totalAllocated, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#8490A5]">Actual Spending</p>
            <p className="mt-1 font-mono-nums text-lg font-bold text-[#E56B6F]">
              {formatCurrency(totalSpent, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#8490A5]">Unallocated Buffer</p>
            <p
              className={`mt-1 font-mono-nums text-lg font-bold ${
                unallocated < 0 ? 'text-[#E56B6F]' : 'text-[#16A36A]'
              }`}
            >
              {formatCurrency(unallocated, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXPENSE_CATEGORIES.map((cat) => {
          const savedBudget = activeMonthBudgets.find((b) => b.category === cat.id);
          const allocated = savedBudget?.limitAmount ?? 0;
          const spent = spendByCat.get(cat.id) || 0;
          const pct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;

          const status =
            allocated === 0
              ? { label: 'No Cap Set', color: 'text-[#8490A5]', bar: '#94A3B8' }
              : pct >= 100
                ? { label: '100%+ Exceeded', color: 'text-[#E56B6F]', bar: '#E56B6F' }
                : pct >= 90
                  ? { label: '90% Critical', color: 'text-[#E56B6F]', bar: '#E56B6F' }
                  : pct >= 70
                    ? { label: '70%+ Warning', color: 'text-[#F4B544]', bar: '#F4B544' }
                    : { label: 'On Track', color: 'text-[#16A36A]', bar: '#18A879' };

          return (
            <div
              key={cat.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-bold text-[#172B4D] dark:text-white">
                    {cat.label}
                  </h3>
                  <p className="text-xs text-[#8490A5] dark:text-slate-400 mt-0.5">
                    {cat.examples}
                  </p>
                </div>
                <span className={`text-xs font-semibold whitespace-nowrap ${status.color}`}>
                  {status.label} {allocated > 0 && `· ${pct}%`}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-[#8490A5] mb-1.5">
                  <span>
                    Actual:{' '}
                    <strong className="font-mono-nums text-[#172B4D] dark:text-white">
                      {formatCurrency(spent, currency)}
                    </strong>
                  </span>
                  <span>
                    Remaining:{' '}
                    <strong className="font-mono-nums text-[#172B4D] dark:text-white">
                      {allocated > 0 ? formatCurrency(allocated - spent, currency) : '—'}
                    </strong>
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{
                      width: `${allocated > 0 ? Math.min(100, pct) : 0}%`,
                      backgroundColor: status.bar,
                    }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <label htmlFor={`bcap-${cat.id}`} className="text-xs font-medium text-[#8490A5]">
                  Budget Limit
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`bcap-${cat.id}`}
                    type="number"
                    min="0"
                    max={MAX_AMOUNT}
                    placeholder={String(cat.defaultCap || 1000)}
                    value={draftCaps[cat.id] ?? ''}
                    onChange={(e) =>
                      setDraftCaps((prev) => ({ ...prev, [cat.id]: e.target.value }))
                    }
                    className="w-28 px-3 py-1.5 font-mono-nums text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveCap(cat.id)}
                    disabled={savingCat === cat.id}
                    className="px-3 py-1.5 text-xs font-semibold text-[#172B4D] dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors whitespace-nowrap"
                  >
                    {savedCat === cat.id ? 'Saved' : savingCat === cat.id ? '...' : 'Save'}
                  </button>
                  {savedBudget && (
                    <button
                      type="button"
                      onClick={() => onDeleteCategoryBudget(savedBudget.id)}
                      aria-label={`Delete ${cat.label} budget`}
                      className="p-1.5 text-[#8490A5] hover:text-[#E56B6F] rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
