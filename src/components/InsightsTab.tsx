import {
  CATEGORIES,
  Expense,
  formatINR,
  formatMonthLabel,
  getCategoryMeta,
  getDaysInMonth,
  PAYMENT_METHODS,
} from '../types/finance';

interface InsightsTabProps {
  monthKey: string;
  monthlyAllowance: number;
  expenses: Expense[];
}

export function InsightsTab({ monthKey, monthlyAllowance, expenses }: InsightsTabProps) {
  const monthExpenses = expenses.filter((e) => e.monthKey === monthKey);
  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const daysInMonth = getDaysInMonth(monthKey);
  const dailySafeBudget = monthlyAllowance > 0 ? Math.round(monthlyAllowance / daysInMonth) : 0;

  const avgTicket =
    monthExpenses.length > 0 ? Math.round(totalSpent / monthExpenses.length) : 0;
  const smallExpensesCount = monthExpenses.filter((e) => e.amount <= 150).length;
  const smallExpensesSum = monthExpenses
    .filter((e) => e.amount <= 150)
    .reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = CATEGORIES.map((cat) => {
    const amount = monthExpenses
      .filter((e) => e.category === cat.id)
      .reduce((sum, e) => sum + e.amount, 0);
    const share = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
    return { ...cat, amount, share };
  })
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const paymentTotals = PAYMENT_METHODS.map((pm) => {
    const amount = monthExpenses
      .filter((e) => e.paymentMethod === pm.id)
      .reduce((sum, e) => sum + e.amount, 0);
    const count = monthExpenses.filter((e) => e.paymentMethod === pm.id).length;
    const share = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
    return { ...pm, amount, count, share };
  });

  // Daily spend buckets for SVG bar chart
  const dailyTotals = Array.from({ length: daysInMonth }, (_, idx) => {
    const dayStr = `${monthKey}-${String(idx + 1).padStart(2, '0')}`;
    const total = monthExpenses
      .filter((e) => e.date === dayStr)
      .reduce((sum, e) => sum + e.amount, 0);
    return { day: idx + 1, total };
  });

  const maxDaily = Math.max(dailySafeBudget * 1.4, ...dailyTotals.map((d) => d.total), 200);
  const topCategory = categoryTotals[0];

  if (monthExpenses.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
        <h2 className="font-display text-lg font-semibold text-slate-900">
          No spending insights for {formatMonthLabel(monthKey)} yet
        </h2>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          Once you log daily transactions, FinTrack Campus highlights where small UPI purchases add
          up and compares your daily pace against your monthly allowance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top 3 Student Observations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Top Spending Category</p>
          <p className="mt-2 font-display text-xl font-bold text-slate-900">
            {topCategory ? topCategory.label : 'None'}
          </p>
          <p className="mt-1 text-xs text-slate-600 font-mono-nums">
            {topCategory
              ? `${formatINR(topCategory.amount)} (${topCategory.share}% of total spend)`
              : 'Log an expense to analyze'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Small Daily Purchases (&le; Rs. 150)</p>
          <p className="mt-2 font-mono-nums text-xl font-bold text-slate-900">
            {formatINR(smallExpensesSum)}
          </p>
          <p className="mt-1 text-xs text-slate-600 font-mono-nums">
            Across {smallExpensesCount} small transactions (avg {formatINR(avgTicket)})
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Ideal Daily Allowance Pace</p>
          <p className="mt-2 font-mono-nums text-xl font-bold text-teal-700">
            {formatINR(dailySafeBudget)} / day
          </p>
          <p className="mt-1 text-xs text-slate-600 font-mono-nums">
            Based on {formatINR(monthlyAllowance)} over {daysInMonth} days
          </p>
        </div>
      </div>

      {/* Daily Spending Pace Chart */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Daily Spend vs Daily Allowance Pace
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dashed line marks {formatINR(dailySafeBudget)} / day target for{' '}
              {formatMonthLabel(monthKey)}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-2 bg-teal-700 inline-block rounded-xs" />
              Within Pace
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-2 bg-amber-600 inline-block rounded-xs" />
              Above Daily Pace
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${daysInMonth * 24} 170`}
            className="w-full min-w-[540px] h-44"
            role="img"
            aria-label="Daily spending bar chart"
          >
            {dailySafeBudget > 0 && (
              <line
                x1={0}
                x2={daysInMonth * 24}
                y1={140 - (dailySafeBudget / maxDaily) * 125}
                y2={140 - (dailySafeBudget / maxDaily) * 125}
                stroke="#64748B"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            )}
            {dailyTotals.map((item, i) => {
              const barHeight = Math.max(2, (item.total / maxDaily) * 125);
              const x = i * 24 + 5;
              const y = 140 - barHeight;
              const fill =
                item.total === 0
                  ? '#E2E8F0'
                  : item.total > dailySafeBudget
                    ? '#D97706'
                    : '#0F766E';
              return (
                <g key={item.day}>
                  <rect
                    x={x}
                    y={item.total === 0 ? 137 : y}
                    width={14}
                    height={item.total === 0 ? 3 : barHeight}
                    rx={3}
                    fill={fill}
                  >
                    <title>
                      Day {item.day}: {formatINR(item.total)}
                    </title>
                  </rect>
                  {(item.day === 1 || item.day % 5 === 0 || item.day === daysInMonth) && (
                    <text
                      x={x + 7}
                      y={158}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#64748B"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {item.day}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      {/* Category Breakdown & Payment Mode Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Category Share Breakdown
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Where your allowance went this month</p>

          <div className="mt-5 space-y-4">
            {categoryTotals.map((cat) => (
              <div key={cat.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{cat.label}</span>
                  <span className="font-mono-nums text-xs text-slate-600">
                    <strong className="text-slate-900">{formatINR(cat.amount)}</strong> · {cat.share}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${cat.share}%`, backgroundColor: cat.barColor }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Payment Mode Split
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">UPI vs Cash vs Card usage</p>

          <div className="mt-5 divide-y divide-slate-200">
            {paymentTotals.map((pm) => (
              <div key={pm.id} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{pm.label}</p>
                  <p className="text-xs text-slate-500 font-mono-nums">
                    {pm.count} {pm.count === 1 ? 'transaction' : 'transactions'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono-nums text-sm font-semibold text-slate-900">
                    {formatINR(pm.amount)}
                  </p>
                  <p className="font-mono-nums text-xs text-slate-500">{pm.share}%</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500 leading-relaxed">
            Largest category:{' '}
            <strong className="text-slate-800">
              {topCategory ? getCategoryMeta(topCategory.id).label : 'N/A'}
            </strong>
            . Watching small daily UPI spends under Rs. 150 typically saves students 15–20% by
            month-end.
          </div>
        </section>
      </div>
    </div>
  );
}
