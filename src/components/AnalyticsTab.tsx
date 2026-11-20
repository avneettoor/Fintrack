import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CurrencyCode,
  EXPENSE_CATEGORIES,
  formatCurrency,
  getCurrentMonthKey,
  getTodayISO,
  shiftMonthKey,
  Transaction,
} from '../types/finance';

interface AnalyticsTabProps {
  currency: CurrencyCode;
  transactions: Transaction[];
}

type DateRangePreset =
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'this_year'
  | 'custom';

export function AnalyticsTab({ currency, transactions }: AnalyticsTabProps) {
  const todayISO = getTodayISO();
  const currentMonthKey = getCurrentMonthKey();
  const [preset, setPreset] = useState<DateRangePreset>('this_month');
  const [customStart, setCustomStart] = useState(`${currentMonthKey}-01`);
  const [customEnd, setCustomEnd] = useState(todayISO);

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    if (preset === 'this_week') {
      const day = now.getDay();
      const diffToMon = (day + 6) % 7;
      const mon = new Date(now);
      mon.setDate(now.getDate() - diffToMon);
      return { startDate: mon.toISOString().slice(0, 10), endDate: todayISO };
    }
    if (preset === 'this_month') {
      return { startDate: `${currentMonthKey}-01`, endDate: `${currentMonthKey}-31` };
    }
    if (preset === 'last_month') {
      const lm = shiftMonthKey(currentMonthKey, -1);
      return { startDate: `${lm}-01`, endDate: `${lm}-31` };
    }
    if (preset === 'last_3_months') {
      const startMk = shiftMonthKey(currentMonthKey, -2);
      return { startDate: `${startMk}-01`, endDate: `${currentMonthKey}-31` };
    }
    if (preset === 'this_year') {
      const year = todayISO.slice(0, 4);
      return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
    }
    return { startDate: customStart, endDate: customEnd };
  }, [preset, currentMonthKey, todayISO, customStart, customEnd]);

  const rangedTxs = useMemo(
    () =>
      transactions.filter(
        (t) => t.type !== 'transfer' && t.date >= startDate && t.date <= endDate
      ),
    [transactions, startDate, endDate]
  );

  const totalIncome = rangedTxs
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = rangedTxs
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  const activeDaysCount = useMemo(() => {
    const startMs = Date.parse(startDate);
    const endMs = Date.parse(endDate > todayISO ? todayISO : endDate);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return 1;
    return Math.max(1, Math.round((endMs - startMs) / 86400000) + 1);
  }, [startDate, endDate, todayISO]);

  const avgDailyExpense = Math.round(totalExpenses / activeDaysCount);

  // Category-wise spending
  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    rangedTxs
      .filter((t) => t.type === 'expense')
      .forEach((t) => map.set(t.category, (map.get(t.category) || 0) + t.amount));
    return EXPENSE_CATEGORIES.map((c) => {
      const amount = map.get(c.id) || 0;
      const pct = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
      return { ...c, amount, pct };
    })
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [rangedTxs, totalExpenses]);

  // Weekly spending pattern (Mon-Sun)
  const weeklyPattern = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const sums = [0, 0, 0, 0, 0, 0, 0];
    rangedTxs
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const d = new Date(`${t.date}T00:00:00`);
        const idx = (d.getDay() + 6) % 7;
        sums[idx] += t.amount;
      });
    return days.map((name, i) => ({ name, amount: sums[i] }));
  }, [rangedTxs]);

  // 6-month trend across all transactions
  const monthlyTrend = useMemo(() => {
    return [-5, -4, -3, -2, -1, 0].map((offset) => {
      const mk = shiftMonthKey(currentMonthKey, offset);
      const txs = transactions.filter((t) => t.monthKey === mk && t.type !== 'transfer');
      return {
        month: mk,
        income: txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions, currentMonthKey]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Category', 'Method', 'Amount'];
    const rows = rangedTxs.map((t) => [
      t.date,
      t.type,
      `"${t.description.replace(/"/g, '""')}"`,
      t.category,
      t.paymentMethod,
      String(t.amount),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fintrack-analytics-${startDate}-to-${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Range Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'last_3_months', label: 'Last 3 Months' },
              { id: 'this_year', label: 'This Year' },
              { id: 'custom', label: 'Custom Range' },
            ] as { id: DateRangePreset; label: string }[]
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setPreset(f.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
                preset === f.id
                  ? 'bg-[#172B4D] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-[#253047] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {preset === 'custom' && (
            <>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-mono-nums border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
              />
              <span className="text-xs text-[#8490A5]">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-mono-nums border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800"
              />
            </>
          )}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={rangedTxs.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#18A879] hover:bg-[#149369] disabled:opacity-50 rounded-xl transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Key Analytics Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <p className="text-xs font-medium text-[#8490A5]">Period Income</p>
          <p className="mt-2 font-mono-nums text-2xl font-bold text-[#16A36A]">
            {formatCurrency(totalIncome, currency)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <p className="text-xs font-medium text-[#8490A5]">Period Expenses</p>
          <p className="mt-2 font-mono-nums text-2xl font-bold text-[#E56B6F]">
            {formatCurrency(totalExpenses, currency)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <p className="text-xs font-medium text-[#8490A5]">Savings Rate</p>
          <p className="mt-2 font-mono-nums text-2xl font-bold text-[#4778E8]">{savingsRate}%</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <p className="text-xs font-medium text-[#8490A5]">Avg Daily Expenditure</p>
          <p className="mt-2 font-mono-nums text-2xl font-bold text-[#172B4D] dark:text-white">
            {formatCurrency(avgDailyExpense, currency)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h2 className="font-display text-base font-bold text-[#172B4D] dark:text-white">
            6-Month Income vs Expense Trend
          </h2>
          <p className="text-xs text-[#8490A5] mt-0.5">Monthly comparison across your history</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8490A5' }} />
                <YAxis tick={{ fontSize: 11, fill: '#8490A5' }} />
                <Tooltip formatter={(v: unknown) => formatCurrency(Number(v), currency)} />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#16A36A"
                  fill="#16A36A"
                  fillOpacity={0.14}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Expenses"
                  stroke="#E56B6F"
                  fill="#E56B6F"
                  fillOpacity={0.14}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <h2 className="font-display text-base font-bold text-[#172B4D] dark:text-white">
            Weekly Spending Pattern
          </h2>
          <p className="text-xs text-[#8490A5] mt-0.5">Which days of the week you spend most</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyPattern}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8490A5' }} />
                <YAxis tick={{ fontSize: 11, fill: '#8490A5' }} />
                <Tooltip formatter={(v: unknown) => formatCurrency(Number(v), currency)} />
                <Bar dataKey="amount" name="Spent" fill="#4778E8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Top Spending Categories */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <h2 className="font-display text-base font-bold text-[#172B4D] dark:text-white">
          Top Spending Categories ({startDate} to {endDate})
        </h2>
        {categoryStats.length === 0 ? (
          <p className="mt-4 text-sm text-[#8490A5]">No expenses in the selected date range.</p>
        ) : (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {categoryStats.map((cat) => (
              <div key={cat.id}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#253047] dark:text-slate-200">
                    {cat.label}
                  </span>
                  <span className="font-mono-nums font-bold text-[#172B4D] dark:text-white">
                    {formatCurrency(cat.amount, currency)} ({cat.pct}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${cat.pct}%`, backgroundColor: cat.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
