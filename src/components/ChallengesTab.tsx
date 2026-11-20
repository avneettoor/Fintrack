import { Award, Check, Trash2, Trophy } from 'lucide-react';
import {
  ACHIEVEMENT_BADGES,
  CategoryBudget,
  Challenge,
  CHALLENGE_TEMPLATES,
  getTodayISO,
  SavingsGoal,
  Transaction,
} from '../types/finance';

interface ChallengesTabProps {
  challenges: Challenge[];
  transactions: Transaction[];
  budgets: CategoryBudget[];
  goals: SavingsGoal[];
  onStartChallenge: (tpl: {
    templateId: string;
    title: string;
    description: string;
    targetDays: number;
    pointsReward: number;
  }) => Promise<void>;
  onToggleCheckIn: (
    challengeId: string,
    completedDays: string[],
    targetDays: number,
    dateISO: string
  ) => Promise<void>;
  onDeleteChallenge: (challengeId: string) => Promise<void>;
}

export function ChallengesTab({
  challenges,
  transactions,
  budgets,
  goals,
  onStartChallenge,
  onToggleCheckIn,
  onDeleteChallenge,
}: ChallengesTabProps) {
  const todayISO = getTodayISO();
  const activeTemplateIds = new Set(challenges.map((c) => c.templateId));

  // Real achievement badge unlocking
  const distinctTxDays = new Set(transactions.map((t) => t.date)).size;
  const unlockedIds = new Set<string>();
  if (transactions.length >= 1) unlockedIds.add('first_tx');
  if (budgets.length >= 3) unlockedIds.add('budget_master');
  if (goals.some((g) => g.savedAmount > 0)) unlockedIds.add('smart_saver');
  if (distinctTxDays >= 7) unlockedIds.add('tracker_7d');
  if (challenges.some((c) => c.status === 'completed' && c.targetDays >= 30)) {
    unlockedIds.add('discipline_30d');
  }
  if (goals.some((g) => g.status === 'completed')) unlockedIds.add('savings_champ');

  const challengePoints = challenges
    .filter((c) => c.status === 'completed')
    .reduce((s, c) => s + c.pointsReward, 0);
  const badgePoints = ACHIEVEMENT_BADGES.filter((b) => unlockedIds.has(b.id)).reduce(
    (s, b) => s + b.points,
    0
  );
  const totalPoints = challengePoints + badgePoints;

  return (
    <div className="space-y-8">
      {/* Discipline Score Summary */}
      <div className="bg-[#172B4D] text-white rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#18A879]/20 text-[#18A879] flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#18A879]">Campus Discipline Score</p>
            <h2 className="font-display text-2xl font-bold font-mono-nums">{totalPoints} pts</h2>
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs font-mono-nums text-slate-300">
          <span>{unlockedIds.size} / {ACHIEVEMENT_BADGES.length} badges unlocked</span>
          <span>{challenges.filter((c) => c.status === 'completed').length} challenges completed</span>
        </div>
      </div>

      {/* Active Challenges */}
      {challenges.length > 0 && (
        <section className="space-y-4">
          <h3 className="font-display text-lg font-bold text-[#172B4D] dark:text-white">
            Your Active &amp; Completed Challenges
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.map((ch) => {
              const checkedToday = ch.completedDays.includes(todayISO);
              const done = ch.status === 'completed';
              const pct = Math.min(100, Math.round((ch.completedDays.length / ch.targetDays) * 100));

              return (
                <div
                  key={ch.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono-nums text-[#8490A5]">
                        {ch.startDate} → {ch.endDate} · {ch.pointsReward} pts
                      </p>
                      <h4 className="mt-1 font-display text-base font-bold text-[#172B4D] dark:text-white">
                        {ch.title}
                      </h4>
                      <p className="mt-1 text-xs text-[#8490A5]">{ch.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteChallenge(ch.id)}
                      aria-label={`Remove ${ch.title}`}
                      className="p-1.5 text-[#8490A5] hover:text-[#E56B6F] rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono-nums text-[#253047] dark:text-slate-300">
                        {ch.completedDays.length} / {ch.targetDays} days ({pct}%)
                      </span>
                      <span className={`font-semibold ${done ? 'text-[#16A36A]' : 'text-[#4778E8]'}`}>
                        {done ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: done ? '#16A36A' : '#18A879',
                        }}
                      />
                    </div>
                  </div>

                  {!done && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-mono-nums text-[#8490A5]">Today: {todayISO}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onToggleCheckIn(ch.id, ch.completedDays, ch.targetDays, todayISO)
                        }
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                          checkedToday
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#16A36A]'
                            : 'bg-[#18A879] text-white hover:bg-[#149369]'
                        }`}
                      >
                        {checkedToday ? 'Checked In Today' : 'Check In Today'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Challenge Catalog */}
      <section className="space-y-4">
        <h3 className="font-display text-lg font-bold text-[#172B4D] dark:text-white">
          Join a Student Money Challenge
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHALLENGE_TEMPLATES.map((tpl) => {
            const joined = activeTemplateIds.has(tpl.templateId);
            return (
              <div
                key={tpl.templateId}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xs"
              >
                <div>
                  <p className="text-xs font-mono-nums font-semibold text-[#18A879]">
                    {tpl.targetDays}-day challenge · +{tpl.pointsReward} pts
                  </p>
                  <h4 className="mt-1 font-display text-base font-bold text-[#172B4D] dark:text-white">
                    {tpl.title}
                  </h4>
                  <p className="mt-1.5 text-xs text-[#8490A5] leading-relaxed">{tpl.description}</p>
                </div>

                <button
                  type="button"
                  disabled={joined}
                  onClick={() => onStartChallenge(tpl)}
                  className="w-full py-2 text-xs font-semibold rounded-xl transition-colors disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-[#8490A5] bg-[#172B4D] text-white hover:bg-[#10203a]"
                >
                  {joined ? 'Challenge Active' : 'Accept Challenge'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Achievement Badges */}
      <section className="space-y-4">
        <h3 className="font-display text-lg font-bold text-[#172B4D] dark:text-white">
          Achievement Badges
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACHIEVEMENT_BADGES.map((badge) => {
            const unlocked = unlockedIds.has(badge.id);
            return (
              <div
                key={badge.id}
                className={`border rounded-2xl p-4 flex items-center gap-3.5 ${
                  unlocked
                    ? 'bg-white dark:bg-slate-900 border-[#18A879]/40'
                    : 'bg-slate-100/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-65'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    unlocked ? 'bg-[#18A879]/15 text-[#18A879]' : 'bg-slate-200 dark:bg-slate-800 text-[#8490A5]'
                  }`}
                >
                  {unlocked ? <Check className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#172B4D] dark:text-white truncate">
                    {badge.title}
                  </p>
                  <p className="text-xs text-[#8490A5] truncate">{badge.description}</p>
                  <p className="text-[11px] font-mono-nums font-semibold text-[#4778E8] mt-0.5">
                    {unlocked ? `Unlocked · +${badge.points} pts` : `Locked · ${badge.points} pts`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
