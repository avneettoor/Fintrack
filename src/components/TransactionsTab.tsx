import { useMemo, useState } from 'react';
import { Download, Paperclip, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import {
  CurrencyCode,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  formatCurrency,
  getCategoryInfo,
  PAYMENT_METHODS,
  PaymentMethod,
  Transaction,
  TransactionType,
  Wallet,
} from '../types/finance';

interface TransactionsTabProps {
  monthKey: string;
  currency: CurrencyCode;
  transactions: Transaction[];
  wallets: Wallet[];
  initialCategoryFilter?: ExpenseCategory | 'all';
  initialWalletFilter?: string | 'all';
  initialSearchQuery?: string;
  onClearExternalFilters: () => void;
  onOpenAddTx: () => void;
  onEditTx: (tx: Transaction) => void;
  onDeleteTx: (txId: string) => Promise<void>;
}

export function TransactionsTab({
  monthKey,
  currency,
  transactions,
  wallets,
  initialCategoryFilter = 'all',
  initialWalletFilter = 'all',
  initialSearchQuery = '',
  onClearExternalFilters,
  onOpenAddTx,
  onEditTx,
  onDeleteTx,
}: TransactionsTabProps) {
  const [search, setSearch] = useState(initialSearchQuery);
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategoryFilter);
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | 'all'>('all');
  const [walletFilter, setWalletFilter] = useState<string>(initialWalletFilter);
  const [scopeAllMonths, setScopeAllMonths] = useState(false);
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>(
    'date_desc'
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<{ name: string; url: string } | null>(null);

  const walletMap = useMemo(() => new Map(wallets.map((w) => [w.id, w.name])), [wallets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions
      .filter((t) => {
        if (!scopeAllMonths && t.monthKey !== monthKey) return false;
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
        if (paymentFilter !== 'all' && t.paymentMethod !== paymentFilter) return false;
        if (
          walletFilter !== 'all' &&
          t.walletId !== walletFilter &&
          t.toWalletId !== walletFilter
        ) {
          return false;
        }
        if (q) {
          const hay = `${t.description} ${t.notes || ''} ${(t.tags || []).join(' ')}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
        if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        return a.amount - b.amount;
      });
  }, [
    transactions,
    scopeAllMonths,
    monthKey,
    typeFilter,
    categoryFilter,
    paymentFilter,
    walletFilter,
    search,
    sortBy,
  ]);

  const totalIn = filtered
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalOut = filtered
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Category', 'Wallet', 'Method', 'Amount', 'Notes', 'Tags'];
    const rows = filtered.map((t) => [
      t.date,
      t.type,
      `"${t.description.replace(/"/g, '""')}"`,
      getCategoryInfo(t.category).label,
      `"${(walletMap.get(t.walletId) || t.walletId).replace(/"/g, '""')}"`,
      t.paymentMethod,
      String(t.amount),
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      `"${(t.tags || []).join(' ').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `fintrack-transactions-${scopeAllMonths ? 'all' : monthKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setPaymentFilter('all');
    setWalletFilter('all');
    onClearExternalFilters();
  };

  return (
    <div className="space-y-5">
      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-[#8490A5] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description, notes, or tags..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#18A879]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setScopeAllMonths((p) => !p)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap ${
                scopeAllMonths
                  ? 'bg-[#172B4D] text-white border-[#172B4D]'
                  : 'bg-slate-50 dark:bg-slate-800 text-[#253047] dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {scopeAllMonths ? 'All Months' : `Month: ${monthKey}`}
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#253047] dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 rounded-xl transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddTx}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#18A879] hover:bg-[#149369] rounded-xl transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TransactionType | 'all')}
            aria-label="Filter by type"
            className="px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#253047] dark:text-slate-200"
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
            <option value="transfer">Transfers Only</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#253047] dark:text-slate-200"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
            <option value="allowance_income">Monthly Allowance</option>
            <option value="freelance_income">Internship / Stipend</option>
            <option value="wallet_transfer">Wallet Transfer</option>
          </select>

          <select
            value={walletFilter}
            onChange={(e) => setWalletFilter(e.target.value)}
            aria-label="Filter by wallet"
            className="px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#253047] dark:text-slate-200"
          >
            <option value="all">All Wallets</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentMethod | 'all')}
            aria-label="Filter by payment method"
            className="px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#253047] dark:text-slate-200"
          >
            <option value="all">All Payment Modes</option>
            {PAYMENT_METHODS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc')
            }
            aria-label="Sort transactions"
            className="px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#253047] dark:text-slate-200"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>

          {(search || typeFilter !== 'all' || categoryFilter !== 'all' || paymentFilter !== 'all' || walletFilter !== 'all') && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-2.5 py-1.5 text-xs font-semibold text-[#E56B6F] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs font-medium text-[#8490A5] dark:text-slate-400 font-mono-nums">
            Showing {filtered.length} {filtered.length === 1 ? 'transaction' : 'transactions'}
          </p>
          <div className="flex items-center gap-5 text-xs font-mono-nums">
            <span>
              Inflow: <strong className="text-[#16A36A]">{formatCurrency(totalIn, currency)}</strong>
            </span>
            <span>
              Outflow: <strong className="text-[#E56B6F]">{formatCurrency(totalOut, currency)}</strong>
            </span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-[#172B4D] dark:text-white">
              No transactions match your filters
            </p>
            <p className="mt-1 text-xs text-[#8490A5]">
              Add a transaction or clear active filters to view history.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-[#F7F9FC] dark:bg-slate-800/60 text-xs font-semibold text-[#8490A5] dark:text-slate-400">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Wallet</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {filtered.map((tx) => {
                  const cat = getCategoryInfo(tx.category);
                  const wName = walletMap.get(tx.walletId) || 'Wallet';
                  const toWName = tx.toWalletId ? walletMap.get(tx.toWalletId) : undefined;
                  const pmLabel =
                    PAYMENT_METHODS.find((p) => p.id === tx.paymentMethod)?.label || tx.paymentMethod;
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-6 font-mono-nums text-xs text-[#8490A5] whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-semibold text-[#172B4D] dark:text-white truncate">
                          {tx.description}
                        </p>
                        {(tx.notes || (tx.tags && tx.tags.length > 0)) && (
                          <p className="text-xs text-[#8490A5] truncate mt-0.5">
                            {[tx.notes, ...(tx.tags || []).map((tg) => `#${tg}`)]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#253047] dark:text-slate-300 whitespace-nowrap">
                        {cat.label}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#253047] dark:text-slate-300 whitespace-nowrap">
                        {tx.type === 'transfer' && toWName ? `${wName} → ${toWName}` : wName}
                      </td>
                      <td className="py-3 px-4 text-xs text-[#8490A5] whitespace-nowrap">
                        {pmLabel}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono-nums font-bold whitespace-nowrap ${
                          tx.type === 'income'
                            ? 'text-[#16A36A]'
                            : tx.type === 'transfer'
                              ? 'text-[#4778E8]'
                              : 'text-[#E56B6F]'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                        {formatCurrency(tx.amount, currency)}
                      </td>
                      <td className="py-3 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {tx.receiptDataUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setReceiptPreview({
                                  name: tx.receiptName || 'Receipt',
                                  url: tx.receiptDataUrl!,
                                })
                              }
                              aria-label="View receipt"
                              className="p-1.5 text-[#4778E8] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onEditTx(tx)}
                            aria-label={`Edit ${tx.description}`}
                            className="p-1.5 text-[#8490A5] hover:text-[#172B4D] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === tx.id}
                            onClick={async () => {
                              setDeletingId(tx.id);
                              try {
                                await onDeleteTx(tx.id);
                              } finally {
                                setDeletingId(null);
                              }
                            }}
                            aria-label={`Delete ${tx.description}`}
                            className="p-1.5 text-[#8490A5] hover:text-[#E56B6F] disabled:opacity-40 rounded-lg hover:bg-red-50 dark:hover:bg-slate-800"
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

      {receiptPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          onClick={() => setReceiptPreview(null)}
        >
          <div
            className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <p className="text-sm font-semibold text-[#172B4D] dark:text-white truncate">
                {receiptPreview.name}
              </p>
              <button
                type="button"
                onClick={() => setReceiptPreview(null)}
                className="text-xs font-semibold text-[#8490A5] hover:text-[#172B4D]"
              >
                Close
              </button>
            </div>
            <img
              src={receiptPreview.url}
              alt={receiptPreview.name}
              className="mt-3 w-full max-h-96 object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
