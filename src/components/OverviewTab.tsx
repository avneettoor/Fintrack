import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Pencil, Plus, Sparkles } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CategoryBudget,
  computeWalletBalances,
  CurrencyCode,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  formatCurrency,
  formatMonthLabel,
  getCategoryInfo,
  getDaysInMonth,
  getRemainingDaysInMonth,
  PAYMENT_METHODS,
  SavingsGoal,
  shiftMonthKey,
  Transaction,
  Wallet,
} from '../types/finance';

interface OverviewTabProps {
  monthKey: string;
  currency: CurrencyCode;
  monthlyBudget: number;
  transactions: Transaction[];
  wallets: Wallet[];
  budgets: CategoryBudget[];
  goals: SavingsGoal[];
  loadingData: boolean;
  seedingDemo: boolean;
  onSeedDemo: () => Promise<void>;
  onOpenAddTx: () => void;
  onEditTx: (tx: Transaction) => void;
  onOpenCategoryTransactions: (cat: ExpenseCategory) => void;
  onViewAllTransactions: () => void;
}

type ChartRange = 'daily' | 'monthly' | 'comparison';

export function OverviewTab({
  monthKey,
  currency,
  monthlyBudget,
  transactions,
  wallets,
  budgets,
  goals,
  loadingData,
  seedingDemo,
  onSeedDemo,
  onOpenAddTx,
  onEditTx,
  onOpenCategoryTransactions,
  onViewAllTransactions,
}: OverviewTabProps) {
  const [chartRange, setChartRange] = useState<ChartRange>('daily');

  const walletBalances = useMemo(
    () => computeWalletBalances(wallets, transactions),
    [wallets, transactions]
  );

  const totalBalance = useMemo(() => {
    let sum = 0;
    walletBalances.forEach((v) => {
      sum += v.balance;
    });
    return sum;
  }, [walletBalances]);

  const monthTxs = useMemo(
    () => transactions.filter((t) => t.monthKey === monthKey),
    [transactions, monthKey]
  );
  const prevMonthKey = shiftMonthKey(monthKey, -1);
  const prevMonthTxs = useMemo(
    () => transactions.filter((t) => t.monthKey === prevMonthKey),
    [transactions, prevMonthKey]
  );

  // Transfers MUST NOT count as income or expenses
  const monthlyIncome = monthTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenses = monthTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const prevMonthIncome = prevMonthTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const prevMonthExpenses = prevMonthTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalGoalSavings = goals.reduce((sum, g) => sum + g.savedAmount, 0);
  const monthlyNetSaved = Math.max(0, monthlyIncome - monthlyExpenses);
  const displayTotalSavings = totalGoalSavings > 0 ? totalGoalSavings : monthlyNetSaved;

  // Monthly budget & Daily Safe-to-Spend
  const monthCategoryBudgets = budgets.filter((b) => b.monthKey === monthKey);
  const allocatedSum = monthCategoryBudgets.reduce((s, b) => s + b.limitAmount, 0);
  const effectiveMonthlyBudget = monthlyBudget > 0 ? monthlyBudget : allocatedSum;
  const remainingBudget = effectiveMonthlyBudget - monthlyExpenses;
  const budgetPct =
    effectiveMonthlyBudget > 0 ? Math.round((monthlyExpenses / effectiveMonthlyBudget) * 100) : 0;
  const remainingDays = getRemainingDaysInMonth(monthKey);
  const dailySafeToSpend = remainingBudget > 0 ? Math.floor(remainingBudget / remainingDays) : 0;

  // Spending by category for Doughnut chart
  const categoryBreakdown = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    monthTxs
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = t.category as ExpenseCategory;
        map.set(cat, (map.get(cat) || 0) + t.amount);
      });
    return EXPENSE_CATEGORIES.map((c) => {
      const amount = map.get(c.id) || 0;
      const pct = monthlyExpenses > 0 ? Math.round((amount / monthlyExpenses) * 100) : 0;
      return { ...c, amount, pct };
    })
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [monthTxs, monthlyExpenses]);

  // Daily chart data
  const dailyChartData = useMemo(() => {
    const days = getDaysInMonth(monthKey);
    return Array.from({ length: days }, (_, idx) => {
      const dayNum = idx + 1;
      const iso = `${monthKey}-${String(dayNum).padStart(2, '0')}`;
      const income = monthTxs
        .filter((t) => t.date === iso && t.type === 'income')
        .reduce((s, t) => s + t.amount, 0);
      const expense = monthTxs
        .filter((t) => t.date === iso && t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
      return { label: String(dayNum), income, expense };
    });
  }, [monthTxs, monthKey]);

  // 6-month trend data
  const monthlyTrendData = useMemo(() => {
    return [-4, -3, -2, -1, 0].map((offset) => {
      const mk = shiftMonthKey(monthKey, offset);
      const txs = transactions.filter((t) => t.monthKey === mk);
      return {
        label: mk.slice(5),
        income: txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions, monthKey]);

  const comparisonData = [
    { label: formatMonthLabel(prevMonthKey).split(' ')[0], income: prevMonthIncome, expense: prevMonthExpenses },
    { label: formatMonthLabel(monthKey).split(' ')[0], income: monthlyIncome, expense: monthlyExpenses },
  ];

  // Real-data Financial Insights
  const insights = useMemo(() => {
    const list: { text: string; tone: 'positive' | 'warning' | 'neutral' }[] = [];

    // Food comparison
    const curFood = monthTxs
      .filter((t) => t.type === 'expense' && t.category === 'food_dining')
      .reduce((s, t) => s + t.amount, 0);
    const prevFood = prevMonthTxs
      .filter((t) => t.type === 'expense' && t.category === 'food_dining')
      .reduce((s, t) => s + t.amount, 0);
    if (prevFood > 0 && curFood > 0) {
      const diffPct = Math.round(((curFood - prevFood) / prevFood) * 100);
      if (diffPct > 0) {
        list.push({ text: `You spent ${diffPct}% more on food this month.`, tone: 'warning' });
      } else if (diffPct < 0) {
        list.push({ text: `Your food expenses decreased by ${Math.abs(diffPct)}% this month.`, tone: 'positive' });
      }
    }

    // Transportation comparison
    const curTrans = monthTxs
      .filter((t) => t.type === 'expense' && t.category === 'transportation')
      .reduce((s, t) => s + t.amount, 0);
    const prevTrans = prevMonthTxs
      .filter((t) => t.type === 'expense' && t.category === 'transportation')
      .reduce((s, t) => s + t.amount, 0);
    if (prevTrans > 0 && curTrans > 0) {
      const diffPct = Math.round(((curTrans - prevTrans) / prevTrans) * 100);
      if (diffPct < 0) {
        list.push({
          text: `Your transportation expenses decreased by ${Math.abs(diffPct)}%.`,
          tone: 'positive',
        });
      } else if (diffPct > 0) {
        list.push({ text: `Your transportation expenses increased by ${diffPct}%.`, tone: 'warning' });
      }
    }

    // Monthly saved insight
    if (monthlyIncome > monthlyExpenses) {
      list.push({
        text: `You have saved ${formatCurrency(monthlyIncome - monthlyExpenses, currency)} this month.`,
        tone: 'positive',
      });
    }

    // Approaching category budget
    for (const cb of monthCategoryBudgets) {
      if (cb.limitAmount <= 0) continue;
      const spent = monthTxs
        .filter((t) => t.type === 'expense' && t.category === cb.category)
        .reduce((s, t) => s + t.amount, 0);
      const pct = Math.round((spent / cb.limitAmount) * 100);
      if (pct >= 70) {
        const label = getCategoryInfo(cb.category).label.toLowerCase();
        list.push({
          text:
            pct >= 100
              ? `You exceeded your ${label} budget (${pct}% used).`
              : `You are approaching your ${label} budget (${pct}% used).`,
          tone: 'warning',
        });
        break;
      }
    }

    // Remaining until month-end
    if (effectiveMonthlyBudget > 0) {
      list.push({
        text:
          remainingBudget >= 0
            ? `You have ${formatCurrency(remainingBudget, currency)} remaining until month-end.`
            : `You are ${formatCurrency(Math.abs(remainingBudget), currency)} over your monthly budget.`,
        tone: remainingBudget >= 0 ? 'neutral' : 'warning',
      });
    }

    return list.slice(0, 5);
  }, [
    monthTxs,
    prevMonthTxs,
    monthlyIncome,
    monthlyExpenses,
    monthCategoryBudgets,
    effectiveMonthlyBudget,
    remainingBudget,
    currency,
  ]);

  const recentFive = useMemo(
    () => [...monthTxs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [monthTxs]
  );

  if (loadingData) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 animate-pulse"
            />
          ))}
        </div>
        <div className="h-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Empty account quick starter banner */}
      {transactions.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#18A879]">Ready for your first entry</p>
            <h2 className="mt-1 font-display text-lg font-bold text-[#172B4D] dark:text-white">
              Your ledger is empty for {formatMonthLabel(monthKey)}
            </h2>
            <p className="mt-1 text-sm text-[#8490A5] dark:text-slate-400">
              Start recording your real expenses and income, or load the optional demonstration data
              (₹20,000 income, ₹7,500 expenses, ₹12,500 balance).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onSeedDemo}
              disabled={seedingDemo}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#172B4D] dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-[#18A879]" />
              <span>{seedingDemo ? 'Loading Demo...' : 'Load Demo Data'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenAddTx}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#18A879] hover:bg-[#149369] rounded-xl transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Transaction</span>
            </button>
          </div>
        </div>
      )}

      {/* A. Four Prominent Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-medium text-[#8490A5] dark:text-slate-400">Total Balance</p>
          <p className="mt-2 font-mono-nums text-2xl font-bold text-[#172B4D] dark:text-white">
            {formatCurrency(totalBalance, currency)}
          </p>
          <p className="mt-1.5 text-xs text-[#8490A5] dark:text-slate-400">
            Across {wallets.length} active {wallets.length === 1 ? 'wallet' : 'wallets'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-medium text-[#8490A5] dark:text-slate-400">Monthly Income</p>
          <p className="mt-2 font-mono-nums text-2xl font-bold text-[#16A36A]">
            {formatCurrency(monthlyIncome, currency)}
          </p>
          <p className="mt-1.5 text-xs text-[#8490A5] dark:text-slate-400">
            Excludes wallet transfers
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-medium text-[#8490A5] dark:text-slate-400">Monthly Expenses</p>
          <p className="mt-2 font-mono-nums text-2xl font-bold text-[#E56B6F]">
            {formatCurrency(monthlyExpenses, currency)}
          </p>
          <p className="mt-1.5 text-xs text-[#8490A5] dark:text-slate-400 font-mono-nums">
            {monthTxs.filter((t) => t.type === 'expense').length} expense entries
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <p className="text-xs font-medium text-[#8490A5] dark:text-slate-400">Total Savings</p>
          <p className="mt-2 font-mono-nums text-2xl font-bold text-[#4778E8]">
            {formatCurrency(displayTotalSavings, currency)}
          </p>
          <p className="mt-1.5 text-xs text-[#8490A5] dark:text-slate-400">
            {totalGoalSavings > 0 ? `Across ${goals.length} savings goals` : 'Current month net surplus'}
          </p>
        </div>
      </div>

      {/* E & F: Monthly Budget Progress + Daily Safe-to-Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#172B4D] dark:text-white">
                Monthly Budget Progress
              </h2>
              <p className="text-xs text-[#8490A5] dark:text-slate-400 mt-0.5">
                {formatMonthLabel(monthKey)} · Budget {formatCurrency(effectiveMonthlyBudget, currency)}
              </p>
            </div>
            <span
              className={`font-mono-nums text-sm font-bold ${
                budgetPct >= 100
                  ? 'text-[#E56B6F]'
                  : budgetPct >= 80
                    ? 'text-[#F4B544]'
                    : 'text-[#18A879]'
              }`}
            >
              Used: {budgetPct}%
            </span>
          </div>

          <div className="mt-4 h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${Math.min(100, budgetPct)}%`,
                backgroundColor:
                  budgetPct >= 100 ? '#E56B6F' : budgetPct >= 80 ? '#F4B544' : '#18A879',
              }}
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[#8490A5] dark:text-slate-400 block">Monthly Budget</span>
              <span className="font-mono-nums text-sm font-bold text-[#172B4D] dark:text-white">
                {formatCurrency(effectiveMonthlyBudget, currency)}
              </span>
            </div>
            <div>
              <span className="text-[#8490A5] dark:text-slate-400 block">Spent</span>
              <span className="font-mono-nums text-sm font-bold text-[#E56B6F]">
                {formatCurrency(monthlyExpenses, currency)}
              </span>
            </div>
            <div>
              <span className="text-[#8490A5] dark:text-slate-400 block">Remaining</span>
              <span className="font-mono-nums text-sm font-bold text-[#16A36A]">
                {formatCurrency(remainingBudget, currency)}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#172B4D] text-white rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-[#18A879]">Daily Safe-to-Spend</p>
            <p className="mt-2 font-display text-2xl font-bold leading-snug">
              You can safely spend{' '}
              <span className="font-mono-nums text-[#18A879]">
                {formatCurrency(dailySafeToSpend, currency)}
              </span>{' '}
              today.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300 font-mono-nums">
            <span>Remaining: {formatCurrency(remainingBudget, currency)}</span>
            <span>{remainingDays} days left in month</span>
          </div>
        </div>
      </div>

      {/* B & C: Income vs Expenses Chart + Spending by Category Doughnut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-display text-base font-bold text-[#172B4D] dark:text-white">
                Income vs Expenses
              </h2>
              <p className="text-xs text-[#8490A5] dark:text-slate-400 mt-0.5">
                Interactive cashflow view (transfers excluded)
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {(
                [
                  { id: 'daily', label: 'Daily' },
                  { id: 'monthly', label: '5-Month' },
                  { id: 'comparison', label: 'vs Last Month' },
                ] as { id: ChartRange; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setChartRange(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    chartRange === tab.id
                      ? 'bg-white dark:bg-slate-700 text-[#172B4D] dark:text-white shadow-sm'
                      : 'text-[#8490A5] hover:text-[#172B4D] dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {chartRange === 'daily' ? (
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8490A5' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#8490A5' }} />
                  <Tooltip
                    formatter={(val: unknown) => formatCurrency(Number(val), currency)}
                  />
                  <Bar dataKey="income" name="Income" fill="#16A36A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expenses" fill="#E56B6F" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : chartRange === 'monthly' ? (
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8490A5' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#8490A5' }} />
                  <Tooltip
                    formatter={(val: unknown) => formatCurrency(Number(val), currency)}
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="#16A36A"
                    strokeWidth={2.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    name="Expenses"
                    stroke="#E56B6F"
                    strokeWidth={2.5}
                  />
                </LineChart>
              ) : (
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#8490A5' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#8490A5' }} />
                  <Tooltip
                    formatter={(val: unknown) => formatCurrency(Number(val), currency)}
                  />
                  <Bar dataKey="income" name="Income" fill="#16A36A" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" name="Expenses" fill="#E56B6F" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </section>

        <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <h2 className="font-display text-base font-bold text-[#172B4D] dark:text-white">
            Spending by Category
          </h2>
          <p className="text-xs text-[#8490A5] dark:text-slate-400 mt-0.5">
            Click any category to view its transactions
          </p>

          {categoryBreakdown.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-[#8490A5]">
              No expenses recorded for this month yet.
            </div>
          ) : (
            <div className="mt-3 space-y-4">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="amount"
                      nameKey="label"
                      innerRadius={45}
                      outerRadius={72}
                      paddingAngle={2}
                      onClick={(_, index) => {
                        const target = categoryBreakdown[index];
                        if (target?.id) onOpenCategoryTransactions(target.id);
                      }}
                    >
                      {categoryBreakdown.map((c) => (
                        <Cell key={c.id} fill={c.color} className="cursor-pointer" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: unknown) => formatCurrency(Number(val), currency)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {categoryBreakdown.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onOpenCategoryTransactions(c.id)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs"
                  >
                    <span className="inline-flex items-center gap-2 text-[#253047] dark:text-slate-200">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.label}
                    </span>
                    <span className="font-mono-nums font-semibold text-[#172B4D] dark:text-white">
                      {formatCurrency(c.amount, currency)}{' '}
                      <span className="text-[#8490A5] font-normal">({c.pct}%)</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* D & G: Recent Transactions + Financial Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#172B4D] dark:text-white">
                Recent Transactions
              </h2>
              <p className="text-xs text-[#8490A5] dark:text-slate-400 mt-0.5">
                5 most recent entries in {formatMonthLabel(monthKey)}
              </p>
            </div>
            <button
              type="button"
              onClick={onViewAllTransactions}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#18A879] hover:underline whitespace-nowrap"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentFive.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#8490A5]">
              No recent transactions this month.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {recentFive.map((tx) => {
                const cat = getCategoryInfo(tx.category);
                const pmLabel =
                  PAYMENT_METHODS.find((p) => p.id === tx.paymentMethod)?.label || tx.paymentMethod;
                return (
                  <div
                    key={tx.id}
                    className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: cat.pastelBg, color: cat.color }}
                      >
                        {tx.type === 'income' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : tx.type === 'transfer' ? (
                          <ArrowLeftRight className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#172B4D] dark:text-white truncate">
                          {tx.description}
                        </p>
                        <p className="text-xs text-[#8490A5] dark:text-slate-400 mt-0.5">
                          {cat.label} · {pmLabel} · <span className="font-mono-nums">{tx.date}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`font-mono-nums text-sm font-bold ${
                          tx.type === 'income'
                            ? 'text-[#16A36A]'
                            : tx.type === 'transfer'
                              ? 'text-[#4778E8]'
                              : 'text-[#E56B6F]'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                        {formatCurrency(tx.amount, currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onEditTx(tx)}
                        aria-label={`Edit ${tx.description}`}
                        className="p-1.5 text-[#8490A5] hover:text-[#172B4D] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
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

        <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <h2 className="font-display text-base font-bold text-[#172B4D] dark:text-white">
            Financial Insights
          </h2>
          <p className="text-xs text-[#8490A5] dark:text-slate-400 mt-0.5">
            Calculated live from your actual transactions
          </p>

          {insights.length === 0 ? (
            <p className="mt-6 text-sm text-[#8490A5]">
              Add transactions and category budgets to generate personalized insights.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
              {insights.map((ins, i) => (
                <div key={i} className="py-3 flex items-start justify-between gap-3">
                  <p className="text-sm text-[#253047] dark:text-slate-200 leading-relaxed">
                    {ins.text}
                  </p>
                  <span
                    className={`text-xs font-semibold shrink-0 ${
                      ins.tone === 'positive'
                        ? 'text-[#16A36A]'
                        : ins.tone === 'warning'
                          ? 'text-[#F4B544]'
                          : 'text-[#4778E8]'
                    }`}
                  >
                    {ins.tone === 'positive'
                      ? 'Positive'
                      : ins.tone === 'warning'
                        ? 'Watch'
                        : 'Summary'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
