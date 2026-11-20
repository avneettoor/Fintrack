import React, { useMemo, useState } from 'react';
import { ArrowLeftRight, Pencil, Plus, Trash2, Wallet as WalletIcon } from 'lucide-react';
import {
  computeWalletBalances,
  CurrencyCode,
  formatCurrency,
  MAX_AMOUNT,
  MAX_WALLET_NAME_LENGTH,
  Transaction,
  WALLET_TYPES,
  Wallet,
  WalletType,
} from '../types/finance';

interface WalletsTabProps {
  currency: CurrencyCode;
  wallets: Wallet[];
  transactions: Transaction[];
  onCreateWallet: (input: {
    name: string;
    type: WalletType;
    openingBalance: number;
    color: string;
  }) => Promise<void>;
  onUpdateWallet: (
    walletId: string,
    input: { name: string; type: WalletType; openingBalance: number; color: string }
  ) => Promise<void>;
  onDeleteWallet: (walletId: string) => Promise<void>;
  onOpenTransfer: () => void;
  onViewWalletTransactions: (walletId: string) => void;
}

export function WalletsTab({
  currency,
  wallets,
  transactions,
  onCreateWallet,
  onUpdateWallet,
  onDeleteWallet,
  onOpenTransfer,
  onViewWalletTransactions,
}: WalletsTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('upi');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [color, setColor] = useState('#18A879');
  const [saving, setSaving] = useState(false);

  const balancesMap = useMemo(
    () => computeWalletBalances(wallets, transactions),
    [wallets, transactions]
  );

  const totalCombined = useMemo(() => {
    let total = 0;
    balancesMap.forEach((v) => {
      total += v.balance;
    });
    return total;
  }, [balancesMap]);

  const openCreate = () => {
    setEditingWallet(null);
    setName('');
    setType('upi');
    setOpeningBalance('0');
    setColor('#18A879');
    setFormOpen(true);
  };

  const openEdit = (w: Wallet) => {
    setEditingWallet(w);
    setName(w.name);
    setType(w.type);
    setOpeningBalance(String(w.openingBalance));
    setColor(w.color);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim().slice(0, MAX_WALLET_NAME_LENGTH),
        type,
        openingBalance: Math.max(-MAX_AMOUNT, Math.min(MAX_AMOUNT, Number(openingBalance) || 0)),
        color,
      };
      if (editingWallet) {
        await onUpdateWallet(editingWallet.id, payload);
      } else {
        await onCreateWallet(payload);
      }
      setFormOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <p className="text-xs font-medium text-[#8490A5]">Combined Wallet Balance</p>
          <p className="mt-1 font-mono-nums text-2xl font-bold text-[#172B4D] dark:text-white">
            {formatCurrency(totalCombined, currency)}
          </p>
          <p className="mt-1 text-xs text-[#8490A5]">
            Manual wallets only · Transfers between wallets never distort Income or Expenses
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenTransfer}
            disabled={wallets.length < 2}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#172B4D] dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 rounded-xl transition-colors whitespace-nowrap"
          >
            <ArrowLeftRight className="w-4 h-4 text-[#4778E8]" />
            <span>Transfer Between Wallets</span>
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#18A879] hover:bg-[#149369] rounded-xl transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Create Wallet</span>
          </button>
        </div>
      </div>

      {/* Create / Edit Wallet Form */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end shadow-xs"
        >
          <div className="sm:col-span-4">
            <label htmlFor="wallet-name" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
              Wallet Name
            </label>
            <input
              id="wallet-name"
              type="text"
              maxLength={MAX_WALLET_NAME_LENGTH}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="College Expenses"
              required
              className="mt-1.5 w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white"
            />
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="wallet-type" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
              Wallet Type
            </label>
            <select
              id="wallet-type"
              value={type}
              onChange={(e) => {
                const nextType = e.target.value as WalletType;
                setType(nextType);
                const meta = WALLET_TYPES.find((wt) => wt.id === nextType);
                if (meta && !editingWallet) setColor(meta.defaultColor);
              }}
              className="mt-1.5 w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white"
            >
              {WALLET_TYPES.map((wt) => (
                <option key={wt.id} value={wt.id}>
                  {wt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="wallet-opening" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
              Opening Balance (₹)
            </label>
            <input
              id="wallet-opening"
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="mt-1.5 w-full px-3 py-2 text-sm font-mono-nums border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white"
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 text-xs font-semibold text-white bg-[#18A879] hover:bg-[#149369] rounded-xl transition-colors"
            >
              {saving ? '...' : editingWallet ? 'Save' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-3 py-2 text-xs font-semibold text-[#8490A5] hover:text-[#172B4D]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {wallets.map((w) => {
          const stats = balancesMap.get(w.id) || { balance: w.openingBalance, txCount: 0 };
          const typeLabel = WALLET_TYPES.find((wt) => wt.id === w.type)?.label || w.type;
          const recentTx = transactions
            .filter((t) => t.walletId === w.id || t.toWalletId === w.id)
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 2);

          return (
            <div
              key={w.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: w.color || '#18A879' }}
                    >
                      <WalletIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-[#172B4D] dark:text-white">
                        {w.name}
                      </h3>
                      <p className="text-xs text-[#8490A5]">
                        {typeLabel} · <span className="font-mono-nums">{stats.txCount} txns</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(w)}
                      aria-label={`Edit ${w.name}`}
                      className="p-1.5 text-[#8490A5] hover:text-[#172B4D] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {wallets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteWallet(w.id)}
                        aria-label={`Delete ${w.name}`}
                        className="p-1.5 text-[#8490A5] hover:text-[#E56B6F] rounded-lg hover:bg-red-50 dark:hover:bg-slate-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="mt-4 font-mono-nums text-2xl font-bold text-[#172B4D] dark:text-white">
                  {formatCurrency(stats.balance, currency)}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <p className="text-[11px] font-semibold text-[#8490A5]">Recent Activity</p>
                  {recentTx.length === 0 ? (
                    <p className="text-xs text-[#8490A5]">No transactions in this wallet yet.</p>
                  ) : (
                    recentTx.map((rt) => (
                      <div key={rt.id} className="flex items-center justify-between text-xs gap-2">
                        <span className="text-[#253047] dark:text-slate-300 truncate">
                          {rt.description}
                        </span>
                        <span className="font-mono-nums font-semibold text-[#172B4D] dark:text-white shrink-0">
                          {formatCurrency(rt.amount, currency)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onViewWalletTransactions(w.id)}
                className="w-full py-2 text-xs font-semibold text-[#18A879] bg-[#18A879]/10 hover:bg-[#18A879]/15 rounded-xl transition-colors"
              >
                View Wallet Transactions
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
