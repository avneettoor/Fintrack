import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  CATEGORIES,
  Expense,
  ExpenseCategory,
  getTodayISO,
  MAX_EXPENSE_AMOUNT,
  MAX_NOTE_LENGTH,
  PAYMENT_METHODS,
  PaymentMethod,
} from '../types/finance';

interface ExpenseModalProps {
  isOpen: boolean;
  editingExpense: Expense | null;
  defaultMonthKey: string;
  onClose: () => void;
  onSave: (data: {
    amount: number;
    category: ExpenseCategory;
    paymentMethod: PaymentMethod;
    note: string;
    date: string;
  }) => Promise<void>;
}

const QUICK_AMOUNTS = [20, 50, 100, 250, 500];

export function ExpenseModal({
  isOpen,
  editingExpense,
  defaultMonthKey,
  onClose,
  onSave,
}: ExpenseModalProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayISO());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editingExpense) {
      setAmount(String(editingExpense.amount));
      setCategory(editingExpense.category);
      setPaymentMethod(editingExpense.paymentMethod);
      setNote(editingExpense.note);
      setDate(editingExpense.date);
    } else {
      const today = getTodayISO();
      const defaultDate = today.startsWith(defaultMonthKey) ? today : `${defaultMonthKey}-15`;
      setAmount('');
      setCategory('food');
      setPaymentMethod('upi');
      setNote('');
      setDate(defaultDate);
    }
  }, [isOpen, editingExpense, defaultMonthKey]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > MAX_EXPENSE_AMOUNT) {
      setError(`Enter a valid amount between Rs. 1 and Rs. ${MAX_EXPENSE_AMOUNT.toLocaleString('en-IN')}.`);
      return;
    }
    const trimmedNote = note.trim();
    if (!trimmedNote) {
      setError('Add a short note (e.g., Campus chai or Auto fare).');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        amount: numericAmount,
        category,
        paymentMethod,
        note: trimmedNote.slice(0, MAX_NOTE_LENGTH),
        date,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expense-modal-title"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <h2 id="expense-modal-title" className="font-display text-lg font-semibold text-slate-900">
            {editingExpense ? 'Edit Expense' : 'Log Daily Expense'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {error && (
            <div className="p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="expense-amount" className="block text-sm font-medium text-slate-700">
              Amount (INR)
            </label>
            <div className="mt-1.5 relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono-nums text-sm text-slate-500">
                Rs.
              </span>
              <input
                id="expense-amount"
                type="number"
                step="1"
                min="1"
                max={MAX_EXPENSE_AMOUNT}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="120"
                required
                className="w-full pl-11 pr-4 py-2.5 font-mono-nums text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
              />
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className="px-2.5 py-1 text-xs font-mono-nums font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
                >
                  +Rs. {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="expense-category" className="block text-sm font-medium text-slate-700">
                Category
              </label>
              <select
                id="expense-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="mt-1.5 w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="expense-date" className="block text-sm font-medium text-slate-700">
                Date
              </label>
              <input
                id="expense-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="mt-1.5 w-full px-3 py-2.5 text-sm font-mono-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-700">Payment Mode</span>
            <div className="mt-1.5 grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-lg">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    paymentMethod === pm.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="expense-note" className="block text-sm font-medium text-slate-700">
                Note or Merchant
              </label>
              <span className="text-xs font-mono-nums text-slate-400">
                {note.length}/{MAX_NOTE_LENGTH}
              </span>
            </div>
            <input
              id="expense-note"
              type="text"
              maxLength={MAX_NOTE_LENGTH}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Canteen chai & sandwich"
              required
              className="mt-1.5 w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
            >
              {saving ? 'Saving...' : editingExpense ? 'Save Changes' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
