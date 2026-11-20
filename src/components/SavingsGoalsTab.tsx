import React, { useState } from 'react';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  CurrencyCode,
  formatCurrency,
  GOAL_CATEGORIES,
  GoalCategory,
  MAX_AMOUNT,
  MAX_GOAL_NAME_LENGTH,
  SavingsGoal,
} from '../types/finance';

interface SavingsGoalsTabProps {
  currency: CurrencyCode;
  goals: SavingsGoal[];
  onCreateGoal: (input: {
    name: string;
    targetAmount: number;
    savedAmount: number;
    targetDate: string;
    category: GoalCategory;
  }) => Promise<void>;
  onUpdateGoal: (
    goalId: string,
    input: {
      name: string;
      targetAmount: number;
      targetDate: string;
      category: GoalCategory;
      currentSaved: number;
    }
  ) => Promise<void>;
  onAdjustGoal: (
    goalId: string,
    currentSaved: number,
    targetAmount: number,
    deltaAmount: number
  ) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
}

export function SavingsGoalsTab({
  currency,
  goals,
  onCreateGoal,
  onUpdateGoal,
  onAdjustGoal,
  onDeleteGoal,
}: SavingsGoalsTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('60000');
  const [savedAmount, setSavedAmount] = useState('0');
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)
  );
  const [category, setCategory] = useState<GoalCategory>('laptop');
  const [saving, setSaving] = useState(false);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const openCreate = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('60000');
    setSavedAmount('0');
    setCategory('laptop');
    setFormOpen(true);
  };

  const openEdit = (g: SavingsGoal) => {
    setEditingGoal(g);
    setName(g.name);
    setTargetAmount(String(g.targetAmount));
    setSavedAmount(String(g.savedAmount));
    setTargetDate(g.targetDate);
    setCategory(g.category);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(targetAmount);
    if (!name.trim() || !Number.isFinite(target) || target <= 0) return;
    setSaving(true);
    try {
      if (editingGoal) {
        await onUpdateGoal(editingGoal.id, {
          name: name.trim().slice(0, MAX_GOAL_NAME_LENGTH),
          targetAmount: Math.min(MAX_AMOUNT, target),
          targetDate,
          category,
          currentSaved: editingGoal.savedAmount,
        });
      } else {
        await onCreateGoal({
          name: name.trim().slice(0, MAX_GOAL_NAME_LENGTH),
          targetAmount: Math.min(MAX_AMOUNT, target),
          savedAmount: Math.max(0, Math.min(target, Number(savedAmount) || 0)),
          targetDate,
          category,
        });
      }
      setFormOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.savedAmount, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <p className="text-xs font-medium text-[#8490A5]">Total Saved Across Goals</p>
          <p className="mt-1 font-mono-nums text-2xl font-bold text-[#4778E8]">
            {formatCurrency(totalSaved, currency)}{' '}
            <span className="text-sm font-normal text-[#8490A5]">
              / {formatCurrency(totalTarget, currency)} target
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#18A879] hover:bg-[#149369] rounded-xl transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Create Savings Goal</span>
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end shadow-xs"
        >
          <div className="sm:col-span-3">
            <label htmlFor="sg-name" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
              Goal Name
            </label>
            <input
              id="sg-name"
              type="text"
              maxLength={MAX_GOAL_NAME_LENGTH}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Buy a Laptop"
              required
              className="mt-1.5 w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="sg-target" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
              Target Amount
            </label>
            <input
              id="sg-target"
              type="number"
              min="1"
              max={MAX_AMOUNT}
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
              className="mt-1.5 w-full px-3 py-2 text-sm font-mono-nums border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white"
            />
          </div>

          {!editingGoal && (
            <div className="sm:col-span-2">
              <label htmlFor="sg-saved" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
                Starting Saved
              </label>
              <input
                id="sg-saved"
                type="number"
                min="0"
                max={MAX_AMOUNT}
                value={savedAmount}
                onChange={(e) => setSavedAmount(e.target.value)}
                className="mt-1.5 w-full px-3 py-2 text-sm font-mono-nums border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white"
              />
            </div>
          )}

          <div className={editingGoal ? 'sm:col-span-3' : 'sm:col-span-2'}>
            <label htmlFor="sg-cat" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
              Category
            </label>
            <select
              id="sg-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value as GoalCategory)}
              className="mt-1.5 w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white"
            >
              {GOAL_CATEGORIES.map((gc) => (
                <option key={gc.id} value={gc.id}>
                  {gc.label}
                </option>
              ))}
            </select>
          </div>

          <div className={editingGoal ? 'sm:col-span-2' : 'sm:col-span-2'}>
            <label htmlFor="sg-date" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
              Target Date
            </label>
            <input
              id="sg-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
              className="mt-1.5 w-full px-3 py-2 text-xs font-mono-nums border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white"
            />
          </div>

          <div className="sm:col-span-1 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 text-xs font-semibold text-white bg-[#18A879] hover:bg-[#149369] rounded-xl"
            >
              {saving ? '...' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {goals.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
          <p className="text-sm font-semibold text-[#172B4D] dark:text-white">No savings goals yet</p>
          <p className="mt-1 text-xs text-[#8490A5]">
            Create a goal for a laptop, smartphone, college trip, or emergency cushion.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100));
            const remaining = Math.max(0, g.targetAmount - g.savedAmount);
            const completed = g.status === 'completed';
            const catMeta = GOAL_CATEGORIES.find((c) => c.id === g.category) || GOAL_CATEGORIES[0];
            const customVal = Number(customAmounts[g.id] || 500);

            return (
              <div
                key={g.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-[#8490A5]">
                      {catMeta.label} · Target <span className="font-mono-nums">{g.targetDate}</span>
                    </p>
                    <h3 className="mt-1 font-display text-lg font-bold text-[#172B4D] dark:text-white">
                      {g.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    {!completed && (
                      <button
                        type="button"
                        onClick={() => openEdit(g)}
                        aria-label={`Edit ${g.name}`}
                        className="p-1.5 text-[#8490A5] hover:text-[#172B4D] dark:hover:text-white rounded-lg"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteGoal(g.id)}
                      aria-label={`Delete ${g.name}`}
                      className="p-1.5 text-[#8490A5] hover:text-[#E56B6F] rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[#8490A5] block">Saved</span>
                    <span className="font-mono-nums text-sm font-bold text-[#16A36A]">
                      {formatCurrency(g.savedAmount, currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8490A5] block">Remaining</span>
                    <span className="font-mono-nums text-sm font-bold text-[#172B4D] dark:text-white">
                      {formatCurrency(remaining, currency)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#8490A5] block">Progress</span>
                    <span className="font-mono-nums text-sm font-bold text-[#4778E8]">{pct}%</span>
                  </div>
                </div>

                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: completed ? '#16A36A' : catMeta.color,
                    }}
                  />
                </div>

                {completed ? (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#16A36A]">
                      <Check className="w-4 h-4" />
                      Goal Completed ({formatCurrency(g.targetAmount, currency)})
                    </span>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <input
                      type="number"
                      min="1"
                      max={MAX_AMOUNT}
                      value={customAmounts[g.id] ?? '500'}
                      onChange={(e) =>
                        setCustomAmounts((prev) => ({ ...prev, [g.id]: e.target.value }))
                      }
                      aria-label={`Amount to add or withdraw for ${g.name}`}
                      className="w-24 px-2.5 py-1.5 font-mono-nums text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={busyId === g.id || !Number.isFinite(customVal) || customVal <= 0}
                        onClick={async () => {
                          setBusyId(g.id);
                          try {
                            await onAdjustGoal(g.id, g.savedAmount, g.targetAmount, customVal);
                          } finally {
                            setBusyId(null);
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-[#18A879] hover:bg-[#149369] disabled:opacity-50 rounded-xl transition-colors whitespace-nowrap"
                      >
                        + Add Money
                      </button>
                      <button
                        type="button"
                        disabled={
                          busyId === g.id ||
                          g.savedAmount <= 0 ||
                          !Number.isFinite(customVal) ||
                          customVal <= 0
                        }
                        onClick={async () => {
                          setBusyId(g.id);
                          try {
                            await onAdjustGoal(
                              g.id,
                              g.savedAmount,
                              g.targetAmount,
                              -Math.min(g.savedAmount, customVal)
                            );
                          } finally {
                            setBusyId(null);
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-[#E56B6F] bg-red-50 dark:bg-red-950/40 hover:bg-red-100 disabled:opacity-40 rounded-xl transition-colors whitespace-nowrap"
                      >
                        - Withdraw
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
