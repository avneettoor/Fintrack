import { useEffect, useState } from 'react';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Menu,
  PiggyBank,
  Plus,
  ReceiptText,
  Target,
  UserCircle,
  X,
} from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import {
  addExpense,
  createSavingsGoal,
  deleteExpense,
  deleteHabitChallenge,
  deleteSavingsGoal,
  depositToGoal,
  seedSampleCampusMonth,
  startHabitChallenge,
  toggleChallengeCheckIn,
  updateExpense,
  updatePlanTier,
  updateUserProfile,
  upsertCategoryBudget,
} from '../lib/fintrackService';
import {
  CategoryBudget,
  Expense,
  ExpenseCategory,
  formatMonthLabel,
  getCurrentMonthKey,
  GoalCategory,
  HabitChallenge,
  PaymentMethod,
  PlanTier,
  SavingsGoal,
  shiftMonthKey,
} from '../types/finance';
import { BudgetsTab } from './BudgetsTab';
import { ExpenseModal } from './ExpenseModal';
import { ExpensesTab } from './ExpensesTab';
import { GoalsChallengesTab } from './GoalsChallengesTab';
import { InsightsTab } from './InsightsTab';
import { OverviewTab } from './OverviewTab';
import { ProfilePlanTab } from './ProfilePlanTab';

type DashboardTab = 'overview' | 'expenses' | 'budgets' | 'goals' | 'insights' | 'profile';

const NAV_ITEMS: { id: DashboardTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'expenses', label: 'Expenses', icon: ReceiptText },
  { id: 'budgets', label: 'Budget Planner', icon: PiggyBank },
  { id: 'goals', label: 'Goals & Habits', icon: Target },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'profile', label: 'Profile & Plan', icon: UserCircle },
];

export function DashboardShell() {
  const { user, profile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [monthKey, setMonthKey] = useState<string>(getCurrentMonthKey());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [challenges, setChallenges] = useState<HabitChallenge[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [seedingSample, setSeedingSample] = useState(false);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoadingData(true);

    let loadedCount = 0;
    const markLoaded = () => {
      loadedCount += 1;
      if (loadedCount >= 4) setLoadingData(false);
    };

    const expPath = `users/${user.uid}/expenses`;
    const unsubExpenses = onSnapshot(
      query(collection(db, 'users', user.uid, 'expenses'), where('userId', '==', user.uid)),
      (snap) => {
        setExpenses(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Expense, 'id'>),
          }))
        );
        markLoaded();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, expPath)
    );

    const budgetPath = `users/${user.uid}/budgets`;
    const unsubBudgets = onSnapshot(
      query(collection(db, 'users', user.uid, 'budgets'), where('userId', '==', user.uid)),
      (snap) => {
        setBudgets(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<CategoryBudget, 'id'>),
          }))
        );
        markLoaded();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, budgetPath)
    );

    const goalsPath = `users/${user.uid}/goals`;
    const unsubGoals = onSnapshot(
      query(collection(db, 'users', user.uid, 'goals'), where('userId', '==', user.uid)),
      (snap) => {
        setGoals(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<SavingsGoal, 'id'>),
          }))
        );
        markLoaded();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, goalsPath)
    );

    const challengesPath = `users/${user.uid}/challenges`;
    const unsubChallenges = onSnapshot(
      query(collection(db, 'users', user.uid, 'challenges'), where('userId', '==', user.uid)),
      (snap) => {
        setChallenges(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<HabitChallenge, 'id'>),
          }))
        );
        markLoaded();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, challengesPath)
    );

    return () => {
      unsubExpenses();
      unsubBudgets();
      unsubGoals();
      unsubChallenges();
    };
  }, [user]);

  if (!user) return null;

  const monthlyAllowance = profile?.monthlyAllowance ?? 8000;
  const activeNav = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];

  const handleSaveExpense = async (data: {
    amount: number;
    category: ExpenseCategory;
    paymentMethod: PaymentMethod;
    note: string;
    date: string;
  }) => {
    setActionError(null);
    if (editingExpense) {
      await updateExpense(user.uid, editingExpense.id, data);
    } else {
      await addExpense(user.uid, data);
    }
  };

  const handleSeedSample = async () => {
    setSeedingSample(true);
    setActionError(null);
    try {
      await seedSampleCampusMonth(user.uid, monthKey);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to load sample data.');
    } finally {
      setSeedingSample(false);
    }
  };

  const handleSaveAllowance = async (nextAllowance: number) => {
    if (!profile) return;
    await updateUserProfile(user.uid, {
      displayName: profile.displayName,
      campusName: profile.campusName,
      monthlyAllowance: nextAllowance,
      photoURL: profile.photoURL,
    });
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="px-5 py-5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <span className="font-display text-base font-bold tracking-tight text-slate-900">
            FinTrack Campus
          </span>
          <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[180px]">
            {profile?.campusName || 'Campus Finance'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation"
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1" aria-label="Workspace Navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                active
                  ? 'bg-teal-50 text-teal-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-teal-700' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab('profile');
            setMobileMenuOpen(false);
          }}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors text-left"
        >
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {(profile?.displayName || user.email || 'S').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {profile?.displayName || user.displayName || 'Student'}
            </p>
            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] h-full z-10">{sidebarContent}</aside>
        </div>
      )}

      {/* Main Content Viewport */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-500 whitespace-nowrap">
                FinTrack Campus
              </span>
              <span className="hidden sm:inline text-slate-300" aria-hidden="true">
                /
              </span>
              <h1 className="font-display font-semibold text-slate-900 truncate">
                {activeNav.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Month Switcher */}
            <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
              <button
                type="button"
                onClick={() => setMonthKey((prev) => shiftMonthKey(prev, -1))}
                aria-label="Previous month"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-l-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 text-xs font-medium font-mono-nums text-slate-800 whitespace-nowrap">
                {formatMonthLabel(monthKey)}
              </span>
              <button
                type="button"
                onClick={() => setMonthKey((prev) => shiftMonthKey(prev, 1))}
                aria-label="Next month"
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-r-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingExpense(null);
                setExpenseModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Log Expense</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {actionError && (
            <div
              role="alert"
              className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-4 text-sm text-red-800"
            >
              <span>{actionError}</span>
              <button
                type="button"
                onClick={() => setActionError(null)}
                className="text-xs font-medium underline whitespace-nowrap"
              >
                Dismiss
              </button>
            </div>
          )}

          {activeTab === 'overview' && (
            <OverviewTab
              monthKey={monthKey}
              monthlyAllowance={monthlyAllowance}
              expenses={expenses}
              budgets={budgets}
              goals={goals}
              challenges={challenges}
              loadingData={loadingData}
              seedingSample={seedingSample}
              onSeedSample={handleSeedSample}
              onOpenAddExpense={() => {
                setEditingExpense(null);
                setExpenseModalOpen(true);
              }}
              onEditExpense={(exp) => {
                setEditingExpense(exp);
                setExpenseModalOpen(true);
              }}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesTab
              monthKey={monthKey}
              expenses={expenses}
              onOpenAddExpense={() => {
                setEditingExpense(null);
                setExpenseModalOpen(true);
              }}
              onEditExpense={(exp) => {
                setEditingExpense(exp);
                setExpenseModalOpen(true);
              }}
              onDeleteExpense={(id) => deleteExpense(user.uid, id)}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsTab
              monthKey={monthKey}
              monthlyAllowance={monthlyAllowance}
              expenses={expenses}
              budgets={budgets}
              onSaveMonthlyAllowance={handleSaveAllowance}
              onSaveCategoryBudget={(cat, limit) =>
                upsertCategoryBudget(user.uid, monthKey, cat, limit)
              }
            />
          )}

          {activeTab === 'goals' && (
            <GoalsChallengesTab
              goals={goals}
              challenges={challenges}
              onCreateGoal={(input) => createSavingsGoal(user.uid, input)}
              onDepositGoal={(goalId, saved, target, dep) =>
                depositToGoal(user.uid, goalId, saved, target, dep)
              }
              onDeleteGoal={(goalId) => deleteSavingsGoal(user.uid, goalId)}
              onStartChallenge={(tpl) => startHabitChallenge(user.uid, tpl)}
              onToggleCheckIn={(chId, days, target, dateISO) =>
                toggleChallengeCheckIn(user.uid, chId, days, target, dateISO)
              }
              onDeleteChallenge={(chId) => deleteHabitChallenge(user.uid, chId)}
            />
          )}

          {activeTab === 'insights' && (
            <InsightsTab
              monthKey={monthKey}
              monthlyAllowance={monthlyAllowance}
              expenses={expenses}
            />
          )}

          {activeTab === 'profile' && (
            <ProfilePlanTab
              profile={profile}
              onUpdateProfile={(updates) => updateUserProfile(user.uid, updates)}
              onUpdatePlanTier={(tier: PlanTier) => updatePlanTier(user.uid, tier)}
              onSeedSample={handleSeedSample}
              seedingSample={seedingSample}
              onSignOut={logout}
            />
          )}
        </main>
      </div>

      <ExpenseModal
        isOpen={expenseModalOpen}
        editingExpense={editingExpense}
        defaultMonthKey={monthKey}
        onClose={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
      />
    </div>
  );
}
