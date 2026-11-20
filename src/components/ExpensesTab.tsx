import { useMemo, useState } from 'react';
import { Download, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import {
  CATEGORIES,
  Expense,
  ExpenseCategory,
  formatINR,
  formatMonthLabel,
  getCategoryMeta,
  PAYMENT_METHODS,
  PaymentMethod,
} from '../types/finance';

interface ExpensesTabProps {
  monthKey: string;
  expenses: Expense[];
  onOpenAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => Promise<void>;
}

export function ExpensesTab({
  monthKey,
  expenses,
  onOpenAddExpense,
  onEditExpense,
  onDeleteExpense,
}: ExpensesTabProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | 'all'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const monthExpenses = useMemo(
    () =>
      expenses
        .filter((e) => e.monthKey === monthKey)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, monthKey]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return monthExpenses.filter((e) => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (paymentFilter !== 'all' && e.paymentMethod !== paymentFilter) return false;
      if (q && !e.note.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [monthExpenses, search, categoryFilter, paymentFilter]);

  const filteredTotal = filtered.reduce((sum, e) => sum + e.amount, 0);

  const handleExportCSV = () => {
    const header = ['Date', 'Category', 'Payment Mode', 'Note', 'Amount (INR)'];
    const rows = filtered.map((e) => [
      e.date,
      getCategoryMeta(e.category).label,
      e.paymentMethod.toUpperCase(),
      `"${e.note.replace(/"/g, '""')}"`,
      String(e.amount),
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fintrack-campus-${monthKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDeleteExpense(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search note or merchant..."
              aria-label="Search expenses"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ExpenseCategory | 'all')}
            aria-label="Filter by category"
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setPaymentFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                paymentFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.id}
                type="button"
                onClick={() => setPaymentFilter(pm.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  paymentFilter === pm.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {pm.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddExpense}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Expense Ledger · {formatMonthLabel(monthKey)}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono-nums">
              Showing {filtered.length} of {monthExpenses.length} entries
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Filtered Total</span>
            <span className="font-mono-nums text-base font-bold text-slate-900">
              {formatINR(filteredTotal)}
            </span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-900">No matching expenses</p>
            <p className="mt-1 text-xs text-slate-500">
              {monthExpenses.length === 0
                ? 'Log your first daily UPI or cash purchase to start tracking.'
                : 'Try clearing your search or category filter.'}
            </p>
            <button
              type="button"
              onClick={onOpenAddExpense}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log First Expense</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-4">Note / Merchant</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filtered.map((expense) => {
                  const cat = getCategoryMeta(expense.category);
                  return (
                    <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-6 font-mono-nums text-xs text-slate-600 whitespace-nowrap">
                        {expense.date}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">
                        {expense.note}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{cat.label}</td>
                      <td className="py-3 px-4 text-xs font-medium uppercase text-slate-600 whitespace-nowrap">
                        {expense.paymentMethod}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-nums font-semibold text-slate-900 whitespace-nowrap">
                        {formatINR(expense.amount)}
                      </td>
                      <td className="py-3 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditExpense(expense)}
                            aria-label={`Edit ${expense.note}`}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(expense.id)}
                            disabled={deletingId === expense.id}
                            aria-label={`Delete ${expense.note}`}
                            className="p-1.5 text-slate-400 hover:text-red-700 disabled:opacity-40 rounded-md hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
