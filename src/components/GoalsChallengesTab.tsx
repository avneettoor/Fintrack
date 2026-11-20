import React, { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import {
  CHALLENGE_TEMPLATES,
  formatINR,
  getTodayISO,
  GOAL_CATEGORIES,
  GoalCategory,
  HabitChallenge,
  MAX_GOAL_AMOUNT,
  MAX_GOAL_TITLE_LENGTH,
  SavingsGoal,
} from '../types/finance';

interface GoalsChallengesTabProps {
  goals: SavingsGoal[];
  challenges: HabitChallenge[];
  onCreateGoal: (input: {
    title: string;
    targetAmount: number;
    savedAmount: number;
    targetDate: string;
    category: GoalCategory;
  }) => Promise<void>;
  onDepositGoal: (
    goalId: string,
    currentSaved: number,
    targetAmount: number,
    depositAmount: number
  ) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onStartChallenge: (template: { templateId: string; title: string; targetDays: number }) => Promise<void>;
  onToggleCheckIn: (
    challengeId: string,
    currentDays: string[],
    targetDays: number,
    dateISO: string
  ) => Promise<void>;
  onDeleteChallenge: (challengeId: string) => Promise<void>;
}

export function GoalsChallengesTab({
  goals,
  challenges,
  onCreateGoal,
  onDepositGoal,
  onDeleteGoal,
  onStartChallenge,
  onToggleCheckIn,
  onDeleteChallenge,
}: GoalsChallengesTabProps) {
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('2500');
  const [savedAmount, setSavedAmount] = useState('0');
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );
  const [category, setCategory] = useState<GoalCategory>('travel');
  const [submittingGoal, setSubmittingGoal] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const todayISO = getTodayISO();

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(targetAmount);
    const saved = Number(savedAmount);
    if (!title.trim() || !Number.isFinite(target) || target <= 0) return;
    setSubmittingGoal(true);
    try {
      await onCreateGoal({
        title: title.trim().slice(0, MAX_GOAL_TITLE_LENGTH),
        targetAmount: Math.min(MAX_GOAL_AMOUNT, target),
        savedAmount: Math.max(0, Math.min(target, Number.isFinite(saved) ? saved : 0)),
        targetDate,
        category,
      });
      setTitle('');
      setTargetAmount('2500');
      setSavedAmount('0');
      setShowGoalForm(false);
    } finally {
      setSubmittingGoal(false);
    }
  };

  const activeTemplateIds = new Set(challenges.map((c) => c.templateId));

  return (
    <div className="space-y-8">
      {/* Savings Goals Section */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Student Savings Goals
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set aside small amounts from your monthly allowance for trips, books, or emergencies.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowGoalForm((prev) => !prev)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showGoalForm ? 'Close Form' : 'New Savings Goal'}</span>
          </button>
        </div>

        {showGoalForm && (
          <form
            onSubmit={handleGoalSubmit}
            className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
          >
            <div className="md:col-span-4">
              <label htmlFor="goal-title" className="block text-xs font-medium text-slate-700">
                Goal Title
              </label>
              <input
                id="goal-title"
                type="text"
                maxLength={MAX_GOAL_TITLE_LENGTH}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Weekend Mussoorie Trip"
                required
                className="mt-1.5 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="goal-target" className="block text-xs font-medium text-slate-700">
                Target (INR)
              </label>
              <input
                id="goal-target"
                type="number"
                min="1"
                max={MAX_GOAL_AMOUNT}
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                required
                className="mt-1.5 w-full px-3 py-2 text-sm font-mono-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="goal-saved" className="block text-xs font-medium text-slate-700">
                Starting Saved
              </label>
              <input
                id="goal-saved"
                type="number"
                min="0"
                max={MAX_GOAL_AMOUNT}
                value={savedAmount}
                onChange={(e) => setSavedAmount(e.target.value)}
                className="mt-1.5 w-full px-3 py-2 text-sm font-mono-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="goal-category" className="block text-xs font-medium text-slate-700">
                Category
              </label>
              <select
                id="goal-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as GoalCategory)}
                className="mt-1.5 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                {GOAL_CATEGORIES.map((gc) => (
                  <option key={gc.id} value={gc.id}>
                    {gc.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex gap-2">
              <div className="flex-1">
                <label htmlFor="goal-date" className="block text-xs font-medium text-slate-700">
                  Target Date
                </label>
                <input
                  id="goal-date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  required
                  className="mt-1.5 w-full px-2.5 py-2 text-xs font-mono-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
              <button
                type="submit"
                disabled={submittingGoal}
                className="self-end px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
              >
                {submittingGoal ? 'Saving...' : 'Create'}
              </button>
            </div>
          </form>
        )}

        {goals.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <p className="text-sm font-medium text-slate-900">No savings goals yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Create your first goal to ring-fence money before everyday UPI spending eats it.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => {
              const pct = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));
              const isCompleted = goal.status === 'completed';
              const catLabel =
                GOAL_CATEGORIES.find((c) => c.id === goal.category)?.label || 'Goal';

              return (
                <div
                  key={goal.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500">
                          {catLabel} · Target <span className="font-mono-nums">{goal.targetDate}</span>
                        </p>
                        <h3 className="mt-1 font-display text-base font-semibold text-slate-900">
                          {goal.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          setBusyId(goal.id);
                          try {
                            await onDeleteGoal(goal.id);
                          } finally {
                            setBusyId(null);
                          }
                        }}
                        disabled={busyId === goal.id}
                        aria-label={`Delete ${goal.title}`}
                        className="p-1.5 text-slate-400 hover:text-red-700 rounded-md hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-baseline justify-between">
                      <span className="font-mono-nums text-lg font-bold text-slate-900">
                        {formatINR(goal.savedAmount)}
                      </span>
                      <span className="font-mono-nums text-xs text-slate-500">
                        of {formatINR(goal.targetAmount)} ({pct}%)
                      </span>
                    </div>

                    <div className="mt-2 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isCompleted ? '#16A34A' : '#0F766E',
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                        <Check className="w-4 h-4" />
                        Goal Reached
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        {[100, 250, 500].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            disabled={busyId === goal.id}
                            onClick={async () => {
                              setBusyId(goal.id);
                              try {
                                await onDepositGoal(
                                  goal.id,
                                  goal.savedAmount,
                                  goal.targetAmount,
                                  amt
                                );
                              } finally {
                                setBusyId(null);
                              }
                            }}
                            className="px-2.5 py-1.5 text-xs font-mono-nums font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors whitespace-nowrap"
                          >
                            +Rs. {amt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Habit Challenges Section */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Student Money Challenges
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Build consistent saving and tracking habits with short campus sprints.
          </p>
        </div>

        {/* Active Challenges */}
        {challenges.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.map((ch) => {
              const checkedToday = ch.completedDays.includes(todayISO);
              const isDone = ch.status === 'completed';
              const pct = Math.min(100, Math.round((ch.completedDays.length / ch.targetDays) * 100));

              return (
                <div key={ch.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500 font-mono-nums">
                        {ch.completedDays.length} / {ch.targetDays} days ·{' '}
                        <span className={isDone ? 'text-emerald-700 font-medium' : 'text-teal-700'}>
                          {isDone ? 'Completed' : 'Active'}
                        </span>
                      </p>
                      <h3 className="mt-1 font-display text-base font-semibold text-slate-900">
                        {ch.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteChallenge(ch.id)}
                      aria-label={`Remove ${ch.title}`}
                      className="p-1.5 text-slate-400 hover:text-red-700 rounded-md hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-200"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: isDone ? '#16A34A' : '#0F766E',
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-xs text-slate-500 font-mono-nums">Today: {todayISO}</span>
                    {!isDone && (
                      <button
                        type="button"
                        onClick={() =>
                          onToggleCheckIn(ch.id, ch.completedDays, ch.targetDays, todayISO)
                        }
                        className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                          checkedToday
                            ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            : 'bg-teal-700 text-white hover:bg-teal-800'
                        }`}
                      >
                        {checkedToday ? 'Checked In Today' : 'Check In Today'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Challenge Templates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CHALLENGE_TEMPLATES.map((tpl) => {
            const started = activeTemplateIds.has(tpl.templateId);
            return (
              <div
                key={tpl.templateId}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <p className="text-xs font-mono-nums text-slate-500">{tpl.targetDays}-day sprint</p>
                  <h3 className="mt-1 font-display text-sm font-semibold text-slate-900">
                    {tpl.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{tpl.summary}</p>
                </div>
                <button
                  type="button"
                  disabled={started}
                  onClick={() => onStartChallenge(tpl)}
                  className="w-full py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap disabled:bg-slate-100 disabled:text-slate-400 bg-slate-900 text-white hover:bg-slate-800"
                >
                  {started ? 'Already Joined' : 'Start Challenge'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
