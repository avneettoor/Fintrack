import { ArrowUpRight, Pencil, Plus, Sparkles } from 'lucide-react';
import {
  CATEGORIES,
  CategoryBudget,
  Expense,
  formatINR,
  formatMonthLabel,
  getCategoryMeta,
  getRemainingDaysInMonth,
  HabitChallenge,
  SavingsGoal,
} from '../types/finance';

interface OverviewTabProps {
  monthKey: string;
  monthlyAllowance: number;
  expenses: Expense[];
  budgets: CategoryBudget[];
  goals: SavingsGoal[];
  challenges: HabitChallenge[];
  loadingData: boolean;
  seedingSample: boolean;
  onSeedSample: () => Promise<void>;
  onOpenAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onNavigateTab: (tab: 'expenses' | 'budgets' | 'goals' | 'insights') => void;
}

export function OverviewTab({
  monthKey,
  monthlyAllowance,
  expenses,
  budgets,
  goals,
  challenges,
  loadingData,
  seedingSample,
  onSeedSample,
  onOpenAddExpense,
  onEditExpense,
  onNavigateTab,
}: OverviewTabProps) {
  const monthExpenses = expenses.filter((e) => e.monthKey === monthKey);
  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingAllowance = monthlyAllowance - totalSpent;
  const remainingDays = getRemainingDaysInMonth(monthKey);
  const safeToSpendDaily = remainingAllowance > 0 ? Math.floor(remainingAllowance / remainingDays) : 0;
  const allowanceUsedPct = monthlyAllowance > 0 ? Math.round((totalSpent / monthlyAllowance) * 100) : 0;

  const totalGoalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);
  const activeGoalsCount = goals.filter((g) => g.status === 'active').length;
  const activeChallengesCount = challenges.filter((c) => c.status === 'active').length;

  const allowanceStatus =
    remainingAllowance < 0
      ? { label: 'Over Allowance', color: 'text-red-700' }
      : allowanceUsedPct >= 80
        ? { label: 'Tight Buffer', color: 'text-amber-700' }
        : { label: 'On Track', color: 'text-emerald-700' };

  const budgetByCategory = new Map<string, number>();
  budgets
    .filter((b) => b.monthKey === monthKey)
    .forEach((b) => budgetByCategory.set(b.category, b.limitAmount));

  const spendByCategory = new Map<string, number>();
  monthExpenses.forEach((e) => {
    spendByCategory.set(e.category, (spendByCategory.get(e.category) || 0) + e.amount);
  });

  const topCategories = CATEGORIES.map((cat) => {
    const spent = spendByCategory.get(cat.id) || 0;
    const cap = budgetByCategory.get(cat.id) ?? cat.defaultCap;
    const pct = cap > 0 ? Math.min(100, Math.round((spent / cap) * 100)) : 0;
    return { ...cat, spent, cap, pct };
  })
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  const recentExpenses = [...monthExpenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  if (loadingData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="h-7 w-28 bg-slate-200 rounded mt-4" />
            </div>
          ))}
        </div>
        <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* First-Time Empty Month Helper */}
      {monthExpenses.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <p className="text-xs font-medium text-teal-800">
              {formatMonthLabel(monthKey)} · Ready to track
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-slate-900">
              No expenses logged for {formatMonthLabel(monthKey)} yet
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
              Record your first UPI or cash purchase in under 10 seconds, or load a realistic Dehradun
              campus student sample month (Rs. 8,000 allowance, 10 expenses, budgets &amp; goals) to
              explore right away.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onSeedSample}
              disabled={seedingSample}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-teal-700" />
              <span>{seedingSample ? 'Loading Sample...' : 'Load Sample Campus Month'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenAddExpense}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Log First Expense</span>
            </button>
          </div>
        </div>
      )}

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">Remaining Allowance</span>
            <span className={`text-xs font-medium ${allowanceStatus.color}`}>
              {allowanceStatus.label}
            </span>
          </div>
          <p className="mt-3 font-mono-nums text-2xl font-bold text-slate-900">
            {formatINR(remainingAllowance)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 font-mono-nums">
            of {formatINR(monthlyAllowance)} monthly budget
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">Safe-to-Spend Today</span>
            <span className="text-xs text-slate-500 font-mono-nums">{remainingDays}d left</span>
          </div>
          <p className="mt-3 font-mono-nums text-2xl font-bold text-teal-700">
            {formatINR(safeToSpendDaily)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">Daily pace to finish month debt-free</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">Spent This Month</span>
            <span className="text-xs font-mono-nums text-slate-500">{allowanceUsedPct}% used</span>
          </div>
          <p className="mt-3 font-mono-nums text-2xl font-bold text-slate-900">
            {formatINR(totalSpent)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 font-mono-nums">
            {monthExpenses.length} {monthExpenses.length === 1 ? 'transaction' : 'transactions'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">Saved in Goals</span>
            <span className="text-xs text-slate-500 font-mono-nums">
              {activeChallengesCount} active habits
            </span>
          </div>
          <p className="mt-3 font-mono-nums text-2xl font-bold text-slate-900">
            {formatINR(totalGoalSaved)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 font-mono-nums">
            Across {activeGoalsCount} active {activeGoalsCount === 1 ? 'goal' : 'goals'}
          </p>
        </div>
      </div>

      {/* Main Two-Column Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Ledger */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Recent Transactions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {formatMonthLabel(monthKey)} · Latest daily entries
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('expenses')}
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 whitespace-nowrap"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-600">No entries recorded for this month yet.</p>
              <button
                type="button"
                onClick={onOpenAddExpense}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Expense</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {recentExpenses.map((expense) => {
                const cat = getCategoryMeta(expense.category);
                return (
                  <div
                    key={expense.id}
                    className="px-6 py-3 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{expense.note}</p>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span>{cat.label}</span>
                        <span aria-hidden="true">·</span>
                        <span className="uppercase">{expense.paymentMethod}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-nums">{expense.date}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono-nums text-sm font-semibold text-slate-900">
                        {formatINR(expense.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onEditExpense(expense)}
                        aria-label={`Edit ${expense.note}`}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Category Budget Pace */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Category Caps
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Top spending areas vs monthly caps</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('budgets')}
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 whitespace-nowrap"
            >
              <span>Adjust caps</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {topCategories.map((cat) => {
              const over = cat.cap > 0 && cat.spent > cat.cap;
              const warn = !over && cat.cap > 0 && cat.spent >= cat.cap * 0.8;
              const barColor = over ? '#DC2626' : warn ? '#D97706' : '#0F766E';
              const statusText = over ? 'Over Cap' : warn ? 'Near Cap' : 'On Track';
              const statusColor = over
                ? 'text-red-700'
                : warn
                  ? 'text-amber-700'
                  : 'text-emerald-700';

              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">{cat.label}</span>
                    <span className="font-mono-nums text-xs text-slate-600">
                      <strong className="text-slate-900">{formatINR(cat.spent)}</strong> /{' '}
                      {formatINR(cat.cap)}
                      <span className={`ml-2 font-sans font-medium ${statusColor}`}>
                        · {statusText}
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-200"
                      style={{
                        width: `${Math.min(100, cat.cap > 0 ? Math.round((cat.spent / cat.cap) * 100) : 0)}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
