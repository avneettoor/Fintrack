import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Crown,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PiggyBank,
  Plus,
  Search,
  Settings,
  Sun,
  Target,
  Trash2,
  Trophy,
  User as UserIcon,
  Wallet as WalletIcon,
  X,
} from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import {
  addTransaction,
  adjustGoalBalance,
  createNotificationIfNew,
  createSavingsGoal,
  createWallet,
  deleteCategoryBudget,
  deleteChallenge,
  deleteNotification,
  deleteSavingsGoal,
  deleteTransaction,
  deleteWallet,
  markNotificationRead,
  seedDemoCampusData,
  selectSubscriptionPlan,
  startChallenge,
  toggleArticleRead,
  toggleChallengeCheckIn,
  updateNotificationPrefs,
  updateSavingsGoalDetails,
  updateThemeMode,
  updateTransaction,
  updateUserProfile,
  updateWallet,
  upsertCategoryBudget,
} from '../lib/fintrackService';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import {
  AppNotification,
  CategoryBudget,
  Challenge,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  formatCurrency,
  formatMonthLabel,
  getCurrentMonthKey,
  getTodayISO,
  SavingsGoal,
  shiftMonthKey,
  Transaction,
  TransactionType,
  Wallet,
} from '../types/finance';
import { AnalyticsTab } from './AnalyticsTab';
import { BrandLogo } from './BrandLogo';
import { BudgetsTab } from './BudgetsTab';
import { ChallengesTab } from './ChallengesTab';
import { HelpSupportTab } from './HelpSupportTab';
import { LearnFinanceTab } from './LearnFinanceTab';
import { OverviewTab } from './OverviewTab';
import { SavingsGoalsTab } from './SavingsGoalsTab';
import { SettingsTab } from './SettingsTab';
import { SubscriptionTab } from './SubscriptionTab';
import { TransactionModal } from './TransactionModal';
import { TransactionsTab } from './TransactionsTab';
import { WalletsTab } from './WalletsTab';

type NavTab =
  | 'overview'
  | 'transactions'
  | 'budgets'
  | 'wallets'
  | 'goals'
  | 'analytics'
  | 'challenges'
  | 'learn'
  | 'settings'
  | 'subscription'
  | 'help';

const MAIN_NAV_ITEMS: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'budgets', label: 'Budgets', icon: PiggyBank },
  { id: 'wallets', label: 'Wallets', icon: WalletIcon },
  { id: 'goals', label: 'Savings Goals', icon: Target },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'challenges', label: 'Money Challenges', icon: Trophy },
  { id: 'learn', label: 'Learn Finance', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const TAB_TITLES: Record<NavTab, string> = {
  overview: 'Dashboard Overview',
  transactions: 'Transactions',
  budgets: 'Monthly & Category Budgets',
  wallets: 'Wallets & Accounts',
  goals: 'Savings Goals',
  analytics: 'Financial Analytics',
  challenges: 'Money Challenges & Badges',
  learn: 'Learn Finance',
  settings: 'Account & App Settings',
  subscription: 'Subscription Plan',
  help: 'Help & Support',
};

export function DashboardShell() {
  const { user, profile, changePassword, sendResetPasswordEmail, deleteAccount, logout } =
    useAuth();

  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [monthKey, setMonthKey] = useState<string>(getCurrentMonthKey());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // External drilldown filters for TransactionsTab
  const [externalCategoryFilter, setExternalCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [externalWalletFilter, setExternalWalletFilter] = useState<string | 'all'>('all');
  const [externalSearchQuery, setExternalSearchQuery] = useState('');
  const [txFilterNonce, setTxFilterNonce] = useState(0);

  // Modal state
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txInitialType, setTxInitialType] = useState<TransactionType>('expense');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Firestore synced state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [seedingDemo, setSeedingDemo] = useState(false);

  const dispatchedNotifKeys = useRef<Set<string>>(new Set());
  const notifContainerRef = useRef<HTMLDivElement>(null);

  // Real-time Firestore listeners (all scoped with where('userId', '==', user.uid) to satisfy allow list rules)
  useEffect(() => {
    if (!user) return;
    setLoadingData(true);

    const txPath = `users/${user.uid}/transactions`;
    const walletsPath = `users/${user.uid}/wallets`;
    const budgetsPath = `users/${user.uid}/budgets`;
    const goalsPath = `users/${user.uid}/savingsGoals`;
    const challengesPath = `users/${user.uid}/challenges`;
    const notifsPath = `users/${user.uid}/notifications`;

    let txReady = false;
    let walletsReady = false;
    const checkReady = () => {
      if (txReady && walletsReady) setLoadingData(false);
    };

    const unsubTx = onSnapshot(
      query(collection(db, 'users', user.uid, 'transactions'), where('userId', '==', user.uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
        list.sort((a, b) => b.date.localeCompare(a.date));
        setTransactions(list);
        txReady = true;
        checkReady();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, txPath)
    );

    const unsubWallets = onSnapshot(
      query(collection(db, 'users', user.uid, 'wallets'), where('userId', '==', user.uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Wallet));
        setWallets(list);
        walletsReady = true;
        checkReady();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, walletsPath)
    );

    const unsubBudgets = onSnapshot(
      query(collection(db, 'users', user.uid, 'budgets'), where('userId', '==', user.uid)),
      (snap) => {
        setBudgets(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CategoryBudget)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, budgetsPath)
    );

    const unsubGoals = onSnapshot(
      query(collection(db, 'users', user.uid, 'savingsGoals'), where('userId', '==', user.uid)),
      (snap) => {
        setGoals(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavingsGoal)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, goalsPath)
    );

    const unsubChallenges = onSnapshot(
      query(collection(db, 'users', user.uid, 'challenges'), where('userId', '==', user.uid)),
      (snap) => {
        setChallenges(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Challenge)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, challengesPath)
    );

    const unsubNotifs = onSnapshot(
      query(collection(db, 'users', user.uid, 'notifications'), where('userId', '==', user.uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
        list.sort((a, b) => {
          const at = a.createdAt?.toMillis?.() || 0;
          const bt = b.createdAt?.toMillis?.() || 0;
          return bt - at;
        });
        setNotifications(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, notifsPath)
    );

    return () => {
      unsubTx();
      unsubWallets();
      unsubBudgets();
      unsubGoals();
      unsubChallenges();
      unsubNotifs();
    };
  }, [user]);

  // Close notification popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Automated smart notification alerts (deduplicated)
  useEffect(() => {
    if (!user || !profile || loadingData) return;

    const existingKeys = new Set(notifications.map((n) => n.dedupeKey));
    const dispatchOnce = (
      dedupeKey: string,
      payload: { title: string; message: string; kind: AppNotification['kind'] }
    ) => {
      const safeKey = dedupeKey.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 80);
      if (existingKeys.has(safeKey) || dispatchedNotifKeys.current.has(safeKey)) return;
      dispatchedNotifKeys.current.add(safeKey);
      void createNotificationIfNew(user.uid, { dedupeKey: safeKey, ...payload });
    };

    const currency = profile.currency || 'INR';
    const currentMonthTxs = transactions.filter((t) => t.monthKey === monthKey);
    const currentMonthExpenses = currentMonthTxs.filter((t) => t.type === 'expense');
    const totalSpent = currentMonthExpenses.reduce((s, t) => s + t.amount, 0);

    // 1. Budget threshold notifications (70%, 90%, 100%)
    if (profile.notificationPrefs?.budgetAlerts) {
      if (profile.monthlyBudget > 0) {
        const monthlyPct = (totalSpent / profile.monthlyBudget) * 100;
        if (monthlyPct >= 100) {
          dispatchOnce(`monthly_${monthKey}_100`, {
            title: 'Monthly Budget Exceeded',
            message: `You have spent ${formatCurrency(totalSpent, currency)} against your ${formatCurrency(profile.monthlyBudget, currency)} cap for ${formatMonthLabel(monthKey)}.`,
            kind: 'budget_exceeded',
          });
        } else if (monthlyPct >= 85) {
          dispatchOnce(`monthly_${monthKey}_85`, {
            title: 'Approaching Monthly Budget',
            message: `You have used ${Math.round(monthlyPct)}% of your ${formatMonthLabel(monthKey)} spending budget.`,
            kind: 'budget_warning',
          });
        }
      }

      const monthBudgets = budgets.filter((b) => b.monthKey === monthKey && b.limitAmount > 0);
      for (const b of monthBudgets) {
        const catSpent = currentMonthExpenses
          .filter((t) => t.category === b.category)
          .reduce((s, t) => s + t.amount, 0);
        const pct = (catSpent / b.limitAmount) * 100;
        const catLabel = EXPENSE_CATEGORIES.find((c) => c.id === b.category)?.label || b.category;
        if (pct >= 100) {
          dispatchOnce(`cat_${monthKey}_${b.category}_100`, {
            title: `${catLabel} Budget Exceeded`,
            message: `Spent ${formatCurrency(catSpent, currency)} out of ${formatCurrency(b.limitAmount, currency)} limit.`,
            kind: 'budget_exceeded',
          });
        } else if (pct >= 90) {
          dispatchOnce(`cat_${monthKey}_${b.category}_90`, {
            title: `${catLabel} at 90%+ Limit`,
            message: `Only ${formatCurrency(Math.max(0, b.limitAmount - catSpent), currency)} left in ${catLabel} for ${formatMonthLabel(monthKey)}.`,
            kind: 'budget_warning',
          });
        } else if (pct >= 70) {
          dispatchOnce(`cat_${monthKey}_${b.category}_70`, {
            title: `${catLabel} Budget Watch (70%+)`,
            message: `You have reached ${Math.round(pct)}% of your ${catLabel} cap.`,
            kind: 'budget_warning',
          });
        }
      }
    }

    // 2. Savings Goal milestones (50% & 100%)
    if (profile.notificationPrefs?.goalMilestones) {
      for (const g of goals) {
        if (g.targetAmount <= 0) continue;
        const pct = (g.savedAmount / g.targetAmount) * 100;
        if (pct >= 100) {
          dispatchOnce(`goal_${g.id}_100`, {
            title: `Goal Reached: ${g.name}`,
            message: `Congratulations! You saved ${formatCurrency(g.savedAmount, currency)} and completed "${g.name}".`,
            kind: 'goal_milestone',
          });
        } else if (pct >= 50) {
          dispatchOnce(`goal_${g.id}_50`, {
            title: `Halfway to ${g.name}`,
            message: `You have saved ${Math.round(pct)}% (${formatCurrency(g.savedAmount, currency)}) toward your goal.`,
            kind: 'goal_milestone',
          });
        }
      }
    }

    // 3. Challenge completion alerts
    if (profile.notificationPrefs?.challengeAlerts) {
      for (const c of challenges) {
        if (c.status === 'completed') {
          dispatchOnce(`challenge_${c.id}_done`, {
            title: `Challenge Completed: ${c.title}`,
            message: `You earned +${c.pointsReward} discipline points by staying consistent for ${c.targetDays} days!`,
            kind: 'challenge_complete',
          });
        }
      }
    }

    // 4. 3-day logging inactivity reminder
    if (profile.notificationPrefs?.inactivityReminders && transactions.length > 0) {
      const latestDate = transactions.reduce(
        (max, t) => (t.date > max ? t.date : max),
        transactions[0].date
      );
      const todayISO = getTodayISO();
      const diffDays = Math.floor(
        (new Date(todayISO).getTime() - new Date(latestDate).getTime()) / 86400000
      );
      if (diffDays >= 3) {
        dispatchOnce(`inactive_${todayISO}`, {
          title: 'Keep Your Expense Streak Alive',
          message: `You haven't logged a transaction in ${diffDays} days. Log today's UPI or cash spends in 10 seconds.`,
          kind: 'inactivity',
        });
      }
    }
  }, [user, profile, loadingData, transactions, budgets, goals, challenges, monthKey, notifications]);

  if (!user || !profile) return null;

  const currency = profile.currency || 'INR';
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const navigateTab = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const openAddTxModal = (type: TransactionType = 'expense') => {
    setEditingTx(null);
    setTxInitialType(type);
    setTxModalOpen(true);
  };

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setExternalCategoryFilter('all');
    setExternalWalletFilter('all');
    setExternalSearchQuery(globalSearch.trim());
    setTxFilterNonce((n) => n + 1);
    setActiveTab('transactions');
  };

  const handleOpenCategoryTransactions = (cat: ExpenseCategory) => {
    setExternalCategoryFilter(cat);
    setExternalWalletFilter('all');
    setExternalSearchQuery('');
    setTxFilterNonce((n) => n + 1);
    setActiveTab('transactions');
  };

  const handleViewWalletTransactions = (walletId: string) => {
    setExternalWalletFilter(walletId);
    setExternalCategoryFilter('all');
    setExternalSearchQuery('');
    setTxFilterNonce((n) => n + 1);
    setActiveTab('transactions');
  };

  const handleSeedDemo = async () => {
    setSeedingDemo(true);
    try {
      await seedDemoCampusData(user.uid, monthKey);
    } finally {
      setSeedingDemo(false);
    }
  };

  const initials = (profile.displayName || 'CS')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-slate-950 text-[#253047] dark:text-slate-100 flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-30">
        <div className="h-16 px-5 flex items-center border-b border-slate-200 dark:border-slate-800">
          <BrandLogo size="md" showTagline />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {MAIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#172B4D] text-white dark:bg-[#18A879] dark:text-white'
                    : 'text-[#253047] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? 'text-[#18A879] dark:text-white' : 'text-[#8490A5]'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Sidebar Links */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <button
            type="button"
            onClick={() => navigateTab('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-slate-100 dark:bg-slate-800 text-[#172B4D] dark:text-white'
                : 'text-[#253047] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UserIcon className="w-4 h-4 text-[#8490A5] shrink-0" />
            <span className="truncate">{profile.displayName}</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTab('subscription')}
            className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'subscription'
                ? 'bg-[#172B4D] text-white dark:bg-[#18A879]'
                : 'text-[#253047] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-3">
              <Crown className="w-4 h-4 text-[#F4B544] shrink-0" />
              <span>Subscription Plan</span>
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-[#18A879] dark:bg-emerald-950/60">
              {profile.planTier === 'free' ? 'Free' : 'Plus'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigateTab('help')}
            className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'help'
                ? 'bg-[#172B4D] text-white dark:bg-[#18A879]'
                : 'text-[#253047] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-[#8490A5] shrink-0" />
            <span>Help &amp; Support</span>
          </button>

          <button
            type="button"
            onClick={() => void logout()}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[#E56B6F] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#172B4D]/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 h-full flex flex-col shadow-xl z-10">
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <BrandLogo size="sm" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-[#8490A5] hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {MAIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium ${
                      active
                        ? 'bg-[#172B4D] text-white dark:bg-[#18A879]'
                        : 'text-[#253047] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
                <button
                  type="button"
                  onClick={() => navigateTab('subscription')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#253047] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Crown className="w-4 h-4 text-[#F4B544]" />
                  <span>Subscription Plan</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateTab('help')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#253047] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <HelpCircle className="w-4 h-4 text-[#8490A5]" />
                  <span>Help &amp; Support</span>
                </button>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#E56B6F] hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </aside>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[#172B4D] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="lg:hidden">
              <BrandLogo size="sm" />
            </div>
            <div className="hidden lg:block min-w-0">
              <h1 className="font-display text-base font-bold text-[#172B4D] dark:text-white truncate">
                {TAB_TITLES[activeTab]}
              </h1>
              <p className="text-[11px] text-[#8490A5] truncate">{profile.campusName}</p>
            </div>
          </div>

          {/* Month Selector */}
          <div className="flex items-center bg-[#F7F9FC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-1.5 py-1">
            <button
              type="button"
              onClick={() => setMonthKey((m) => shiftMonthKey(m, -1))}
              className="p-1 rounded-lg text-[#8490A5] hover:text-[#172B4D] dark:hover:text-white"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 sm:px-3 text-xs font-semibold text-[#172B4D] dark:text-white whitespace-nowrap font-mono-nums">
              {formatMonthLabel(monthKey)}
            </span>
            <button
              type="button"
              onClick={() => setMonthKey((m) => shiftMonthKey(m, 1))}
              className="p-1 rounded-lg text-[#8490A5] hover:text-[#172B4D] dark:hover:text-white"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Search + Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <form onSubmit={handleGlobalSearchSubmit} className="hidden md:block relative">
              <Search className="w-3.5 h-3.5 text-[#8490A5] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search spends..."
                className="w-44 lg:w-52 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F7F9FC] dark:bg-slate-800 text-xs text-[#253047] dark:text-slate-100 placeholder:text-[#8490A5] focus:outline-none focus:ring-2 focus:ring-[#18A879]/30"
              />
            </form>

            {/* Theme Quick Toggle */}
            <button
              type="button"
              onClick={() =>
                void updateThemeMode(user.uid, profile.theme === 'dark' ? 'light' : 'dark')
              }
              className="hidden sm:inline-flex p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-[#8490A5] hover:text-[#172B4D] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
              aria-label="Toggle color theme"
              title={profile.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {profile.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#F4B544]" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Notifications Bell */}
            <div ref={notifContainerRef} className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-[#253047] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E56B6F] text-white text-[10px] font-bold flex items-center justify-center font-mono-nums">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-40">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-display text-xs font-bold text-[#172B4D] dark:text-white">
                      Campus Alerts ({notifications.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-[#8490A5] hover:text-[#172B4D] dark:hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#8490A5]">
                        No notifications right now. Budget thresholds, goal milestones, and streak reminders appear here automatically.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.read) void markNotificationRead(user.uid, n.id);
                          }}
                          className={`px-4 py-3 flex items-start justify-between gap-2 cursor-pointer transition-colors ${
                            n.read
                              ? 'bg-white dark:bg-slate-900'
                              : 'bg-emerald-50/50 dark:bg-emerald-950/20'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#172B4D] dark:text-white">
                              {n.title}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#8490A5] leading-relaxed">
                              {n.message}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void deleteNotification(user.uid, n.id);
                            }}
                            className="p-1 text-[#8490A5] hover:text-[#E56B6F] shrink-0"
                            aria-label="Delete notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Add Button */}
            <button
              type="button"
              onClick={() => openAddTxModal('expense')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#18A879] hover:bg-[#149369] text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Quick Add</span>
            </button>

            {/* User Avatar */}
            <button
              type="button"
              onClick={() => navigateTab('settings')}
              className="w-9 h-9 rounded-xl bg-[#172B4D] text-white text-xs font-bold flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0"
              title={`${profile.displayName} — Open Settings`}
            >
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                initials
              )}
            </button>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-10 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewTab
              monthKey={monthKey}
              currency={currency}
              monthlyBudget={profile.monthlyBudget}
              transactions={transactions}
              wallets={wallets}
              budgets={budgets}
              goals={goals}
              loadingData={loadingData}
              seedingDemo={seedingDemo}
              onSeedDemo={handleSeedDemo}
              onOpenAddTx={() => openAddTxModal('expense')}
              onEditTx={(tx) => {
                setEditingTx(tx);
                setTxModalOpen(true);
              }}
              onOpenCategoryTransactions={handleOpenCategoryTransactions}
              onViewAllTransactions={() => {
                setExternalCategoryFilter('all');
                setExternalWalletFilter('all');
                setExternalSearchQuery('');
                setTxFilterNonce((n) => n + 1);
                setActiveTab('transactions');
              }}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsTab
              key={`${txFilterNonce}_${externalCategoryFilter}_${externalWalletFilter}_${externalSearchQuery}`}
              monthKey={monthKey}
              currency={currency}
              transactions={transactions}
              wallets={wallets}
              initialCategoryFilter={externalCategoryFilter}
              initialWalletFilter={externalWalletFilter}
              initialSearchQuery={externalSearchQuery}
              onClearExternalFilters={() => {
                setExternalCategoryFilter('all');
                setExternalWalletFilter('all');
                setExternalSearchQuery('');
                setGlobalSearch('');
                setTxFilterNonce((n) => n + 1);
              }}
              onOpenAddTx={() => openAddTxModal('expense')}
              onEditTx={(tx) => {
                setEditingTx(tx);
                setTxModalOpen(true);
              }}
              onDeleteTx={(txId) => deleteTransaction(user.uid, txId)}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsTab
              monthKey={monthKey}
              currency={currency}
              monthlyBudget={profile.monthlyBudget}
              transactions={transactions}
              budgets={budgets}
              onSaveMonthlyBudget={(nextBudget) =>
                updateUserProfile(user.uid, {
                  displayName: profile.displayName,
                  campusName: profile.campusName,
                  ageGroup: profile.ageGroup,
                  currency: profile.currency,
                  monthlyAllowance: profile.monthlyAllowance,
                  monthlyBudget: nextBudget,
                  savingsTarget: profile.savingsTarget,
                  photoURL: profile.photoURL,
                })
              }
              onSaveCategoryBudget={(category, limitAmount) =>
                upsertCategoryBudget(user.uid, monthKey, category, limitAmount)
              }
              onDeleteCategoryBudget={(budgetId) => deleteCategoryBudget(user.uid, budgetId)}
            />
          )}

          {activeTab === 'wallets' && (
            <WalletsTab
              currency={currency}
              wallets={wallets}
              transactions={transactions}
              onCreateWallet={(input) => createWallet(user.uid, input)}
              onUpdateWallet={(walletId, input) => updateWallet(user.uid, walletId, input)}
              onDeleteWallet={(walletId) => deleteWallet(user.uid, walletId)}
              onOpenTransfer={() => openAddTxModal('transfer')}
              onViewWalletTransactions={handleViewWalletTransactions}
            />
          )}

          {activeTab === 'goals' && (
            <SavingsGoalsTab
              currency={currency}
              goals={goals}
              onCreateGoal={(input) => createSavingsGoal(user.uid, input)}
              onUpdateGoal={(goalId, input) => updateSavingsGoalDetails(user.uid, goalId, input)}
              onAdjustGoal={(goalId, currentSaved, targetAmount, delta) =>
                adjustGoalBalance(user.uid, goalId, currentSaved, targetAmount, delta)
              }
              onDeleteGoal={(goalId) => deleteSavingsGoal(user.uid, goalId)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab currency={currency} transactions={transactions} />
          )}

          {activeTab === 'challenges' && (
            <ChallengesTab
              challenges={challenges}
              transactions={transactions}
              budgets={budgets}
              goals={goals}
              onStartChallenge={(tpl) => startChallenge(user.uid, tpl)}
              onToggleCheckIn={async (challengeId, completedDays, targetDays, dateISO) => {
                await toggleChallengeCheckIn(
                  user.uid,
                  challengeId,
                  completedDays,
                  targetDays,
                  dateISO
                );
              }}
              onDeleteChallenge={(challengeId) => deleteChallenge(user.uid, challengeId)}
            />
          )}

          {activeTab === 'learn' && (
            <LearnFinanceTab
              readArticleIds={profile.readArticleIds || []}
              onToggleArticleRead={(articleId) =>
                toggleArticleRead(user.uid, profile.readArticleIds || [], articleId)
              }
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              profile={profile}
              transactions={transactions}
              seedingDemo={seedingDemo}
              onUpdateProfile={(input) => updateUserProfile(user.uid, input)}
              onUpdateTheme={(theme) => updateThemeMode(user.uid, theme)}
              onUpdateNotificationPrefs={(prefs) => updateNotificationPrefs(user.uid, prefs)}
              onChangePassword={changePassword}
              onSendPasswordReset={sendResetPasswordEmail}
              onSeedDemo={handleSeedDemo}
              onDeleteAccount={deleteAccount}
            />
          )}

          {activeTab === 'subscription' && (
            <SubscriptionTab
              currentPlan={profile.planTier || 'free'}
              onSelectPlan={(plan, cycle, priceInr) =>
                selectSubscriptionPlan(user.uid, plan, cycle, priceInr)
              }
            />
          )}

          {activeTab === 'help' && <HelpSupportTab />}
        </main>
      </div>

      {/* Floating Quick-Add Action Button */}
      <button
        type="button"
        onClick={() => openAddTxModal('expense')}
        className="fixed bottom-18 lg:bottom-6 right-5 z-30 w-12 h-12 rounded-full bg-[#18A879] hover:bg-[#149369] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105"
        aria-label="Quick add transaction"
        title="Quick add transaction"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Mobile Simplified Bottom Navigation */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 grid grid-cols-5"
      >
        {(
          [
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'transactions', label: 'Activity', icon: ArrowLeftRight },
            { id: 'budgets', label: 'Budgets', icon: PiggyBank },
            { id: 'wallets', label: 'Wallets', icon: WalletIcon },
          ] as { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[]
        ).map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigateTab(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
                active ? 'text-[#18A879]' : 'text-[#8490A5]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-[#8490A5]"
        >
          <Menu className="w-4 h-4" />
          <span>More</span>
        </button>
      </nav>

      {/* Add / Edit Transaction Modal */}
      <TransactionModal
        isOpen={txModalOpen}
        editingTx={editingTx}
        defaultMonthKey={monthKey}
        wallets={wallets}
        initialType={txInitialType}
        onClose={() => {
          setTxModalOpen(false);
          setEditingTx(null);
        }}
        onSave={async (data) => {
          if (editingTx) {
            await updateTransaction(user.uid, editingTx.id, data);
          } else {
            await addTransaction(user.uid, data);
          }
        }}
      />
    </div>
  );
}
