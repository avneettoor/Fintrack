import React, { useEffect, useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  getTodayISO,
  INCOME_CATEGORIES,
  MAX_AMOUNT,
  MAX_DESC_LENGTH,
  MAX_NOTES_LENGTH,
  PAYMENT_METHODS,
  PaymentMethod,
  Transaction,
  TransactionType,
  TxCategory,
  Wallet,
} from '../types/finance';

interface TransactionModalProps {
  isOpen: boolean;
  editingTx: Transaction | null;
  defaultMonthKey: string;
  wallets: Wallet[];
  initialType?: TransactionType;
  onClose: () => void;
  onSave: (data: {
    type: TransactionType;
    amount: number;
    description: string;
    category: TxCategory;
    date: string;
    paymentMethod: PaymentMethod;
    walletId: string;
    toWalletId?: string;
    notes?: string;
    tags: string[];
    receiptName?: string;
    receiptDataUrl?: string;
  }) => Promise<void>;
}

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000];

export function TransactionModal({
  isOpen,
  editingTx,
  defaultMonthKey,
  wallets,
  initialType = 'expense',
  onClose,
  onSave,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TxCategory>('food_dining');
  const [date, setDate] = useState(getTodayISO());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [walletId, setWalletId] = useState(wallets[0]?.id || 'wallet_upi');
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id || wallets[0]?.id || 'wallet_savings');
  const [notes, setNotes] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [receiptName, setReceiptName] = useState<string | undefined>(undefined);
  const [receiptDataUrl, setReceiptDataUrl] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingTx) {
      setType(editingTx.type);
      setAmount(String(editingTx.amount));
      setDescription(editingTx.description);
      setCategory(editingTx.category);
      setDate(editingTx.date);
      setPaymentMethod(editingTx.paymentMethod);
      setWalletId(editingTx.walletId);
      setToWalletId(editingTx.toWalletId || wallets[1]?.id || wallets[0]?.id || 'wallet_savings');
      setNotes(editingTx.notes || '');
      setTagsText((editingTx.tags || []).join(', '));
      setReceiptName(editingTx.receiptName);
      setReceiptDataUrl(editingTx.receiptDataUrl);
    } else {
      const today = getTodayISO();
      const defaultDate = today.startsWith(defaultMonthKey) ? today : `${defaultMonthKey}-15`;
      setType(initialType);
      setAmount('');
      setDescription('');
      setCategory(
        initialType === 'income'
          ? 'allowance_income'
          : initialType === 'transfer'
            ? 'wallet_transfer'
            : 'food_dining'
      );
      setDate(defaultDate);
      setPaymentMethod('upi');
      setWalletId(wallets[0]?.id || 'wallet_upi');
      setToWalletId(wallets[1]?.id || wallets[0]?.id || 'wallet_savings');
      setNotes('');
      setTagsText('');
      setReceiptName(undefined);
      setReceiptDataUrl(undefined);
    }
  }, [isOpen, editingTx, defaultMonthKey, initialType, wallets]);

  if (!isOpen) return null;

  const handleTypeSwitch = (nextType: TransactionType) => {
    setType(nextType);
    if (nextType === 'expense') setCategory('food_dining');
    else if (nextType === 'income') setCategory('allowance_income');
    else setCategory('wallet_transfer');
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptName(file.name.slice(0, 140));
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        if (result.length <= 190000) {
          setReceiptDataUrl(result);
        } else {
          setReceiptDataUrl(undefined);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setReceiptDataUrl(undefined);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > MAX_AMOUNT) {
      setError('Enter a valid amount greater than ₹0.');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a merchant or short description.');
      return;
    }
    if (type === 'transfer' && walletId === toWalletId) {
      setError('Source and destination wallets must be different for a transfer.');
      return;
    }

    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 8);

    setSaving(true);
    setError(null);
    try {
      await onSave({
        type,
        amount: numericAmount,
        description: description.trim().slice(0, MAX_DESC_LENGTH),
        category: type === 'transfer' ? 'wallet_transfer' : category,
        date,
        paymentMethod,
        walletId,
        toWalletId: type === 'transfer' ? toWalletId : undefined,
        notes: notes.trim() ? notes.trim().slice(0, MAX_NOTES_LENGTH) : undefined,
        tags,
        receiptName,
        receiptDataUrl,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save transaction.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 my-8 shadow-xl">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <h2 id="tx-modal-title" className="font-display text-lg font-bold text-[#172B4D] dark:text-white">
            {editingTx ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          {/* 1. Transaction Type */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(['expense', 'income', 'transfer'] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeSwitch(t)}
                className={`py-2 text-xs font-semibold capitalize rounded-lg transition-colors whitespace-nowrap ${
                  type === t
                    ? 'bg-white dark:bg-slate-700 text-[#172B4D] dark:text-white shadow-sm'
                    : 'text-[#8490A5] hover:text-[#172B4D] dark:hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* 2. Amount */}
          <div>
            <label htmlFor="tx-amount" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
              Amount (₹)
            </label>
            <div className="mt-1 relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono-nums text-sm font-semibold text-[#8490A5]">
                ₹
              </span>
              <input
                id="tx-amount"
                type="number"
                step="1"
                min="1"
                max={MAX_AMOUNT}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="250"
                required
                className="w-full pl-9 pr-4 py-2.5 font-mono-nums text-base font-semibold border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#18A879]"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESET_AMOUNTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(String(p))}
                  className="px-2.5 py-1 text-xs font-mono-nums font-medium text-[#253047] dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  ₹{p}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Description */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="tx-desc" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
                Description / Merchant
              </label>
              <span className="text-[11px] font-mono-nums text-[#8490A5]">
                {description.length}/{MAX_DESC_LENGTH}
              </span>
            </div>
            <input
              id="tx-desc"
              type="text"
              maxLength={MAX_DESC_LENGTH}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === 'income'
                  ? 'Monthly allowance'
                  : type === 'transfer'
                    ? 'Transfer to Savings Wallet'
                    : 'Campus canteen lunch'
              }
              required
              className="mt-1 w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#18A879]"
            />
          </div>

          {/* 4 & 5. Category + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {type !== 'transfer' ? (
              <div>
                <label htmlFor="tx-category" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
                  Category
                </label>
                <select
                  id="tx-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TxCategory)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#18A879]"
                >
                  {type === 'expense'
                    ? EXPENSE_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))
                    : INCOME_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                </select>
              </div>
            ) : (
              <div>
                <label htmlFor="tx-to-wallet" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
                  Destination Wallet
                </label>
                <select
                  id="tx-to-wallet"
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#18A879]"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="tx-date" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
                Date
              </label>
              <input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="mt-1 w-full px-3 py-2 text-sm font-mono-nums border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#18A879]"
              />
            </div>
          </div>

          {/* 6 & 7. Wallet + Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tx-wallet" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
                {type === 'transfer' ? 'Source Wallet' : type === 'income' ? 'Deposit To Wallet' : 'Paid From Wallet'}
              </label>
              <select
                id="tx-wallet"
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#18A879]"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tx-method" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
                Payment Method
              </label>
              <select
                id="tx-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#18A879]"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 8. Notes & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tx-notes" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
                Notes (Optional)
              </label>
              <input
                id="tx-notes"
                type="text"
                maxLength={MAX_NOTES_LENGTH}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Split with hostel mates"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#18A879]"
              />
            </div>

            <div>
              <label htmlFor="tx-tags" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
                Tags (comma separated)
              </label>
              <input
                id="tx-tags"
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="canteen, hostel"
                className="mt-1 w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#18A879]"
              />
            </div>
          </div>

          {/* 9. Receipt Attachment */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-[#F7F9FC] dark:bg-slate-800/40">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#172B4D] dark:text-slate-200 cursor-pointer">
              <Paperclip className="w-4 h-4 text-[#18A879]" />
              <span>{receiptName ? `Attached: ${receiptName}` : 'Attach receipt (optional)'}</span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleReceiptChange}
                className="sr-only"
              />
            </label>
            {receiptName && (
              <button
                type="button"
                onClick={() => {
                  setReceiptName(undefined);
                  setReceiptDataUrl(undefined);
                }}
                className="text-xs text-[#E56B6F] hover:underline"
              >
                Remove
              </button>
            )}
          </div>

          {type === 'transfer' && (
            <p className="text-xs text-[#4778E8]">
              Wallet transfers adjust balances between your wallets without affecting Monthly Income
              or Monthly Expenses.
            </p>
          )}

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#253047] dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-[#18A879] hover:bg-[#149369] disabled:opacity-60 rounded-xl transition-colors"
            >
              {saving ? 'Saving...' : editingTx ? 'Save Changes' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
