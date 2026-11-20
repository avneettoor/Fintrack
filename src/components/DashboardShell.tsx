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
  LogIn,
  LogOut,
  Menu,
  Moon,
  PiggyBank,
  Plus,
  RotateCcw,
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
import { collection, onSnapshot, query, Timestamp, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { createInitialDemoDataset, DemoDataset } from '../lib/demoData';
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
  NotificationPrefs,
  PlanTier,
  SavingsGoal,
  shiftMonthKey,
  ThemeMode,
  Transaction,
  TransactionType,
  UserProfile,
  Wallet,
} from '../types/finance';
import { AnalyticsTab } from './AnalyticsTab';
import { AuthModal } from './AuthModal';
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

export function DashboardShell({ isDemo = false }: { isDemo?: boolean }) {
  const {
    user,
    profile: liveProfile,
    changePassword,
    sendResetPasswordEmail,
    deleteAccount,
    logout,
    exitDemoMode,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [monthKey, setMonthKey] = useState<string>(getCurrentMonthKey());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [demoAuthOpen, setDemoAuthOpen] = useState(false);

  // External drilldown filters for TransactionsTab
  const [externalCategoryFilter, setExternalCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [externalWalletFilter, setExternalWalletFilter] = useState<string | 'all'>('all');
  const [externalSearchQuery, setExternalSearchQuery] = useState('');
  const [txFilterNonce, setTxFilterNonce] = useState(0);

  // Modal state
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txInitialType, setTxInitialType] = useState<TransactionType>('expense');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Firestore synced state (for authenticated users)
  const [liveTransactions, setLiveTransactions] = useState<Transaction[]>([]);
  const [liveWallets, setLiveWallets] = useState<Wallet[]>([]);
  const [liveBudgets, setLiveBudgets] = useState<CategoryBudget[]>([]);
  const [liveGoals, setLiveGoals] = useState<SavingsGoal[]>([]);
  const [liveChallenges, setLiveChallenges] = useState<Challenge[]>([]);
  const [liveNotifications, setLiveNotifications] = useState<AppNotification[]>([]);
  const [loadingData, setLoadingData] = useState(!isDemo);
  const [seedingDemo, setSeedingDemo] = useState(false);

  // In-memory state (for pre-login interactive Demo Mode)
  const [demoData, setDemoData] = useState<DemoDataset>(() =>
    createInitialDemoDataset(getCurrentMonthKey())
  );

  const dispatchedNotifKeys = useRef<Set<string>>(new Set());
  const notifContainerRef = useRef<HTMLDivElement>(null);

  // Sync dark mode class in demo mode
  useEffect(() => {
    if (!isDemo) return;
    document.documentElement.classList.toggle('dark', demoData.profile.theme === 'dark');
  }, [isDemo, demoData.profile.theme]);

  // Real-time Firestore listeners (strictly authenticated users only)
  useEffect(() => {
    if (isDemo || !user) {
      setLoadingData(false);
      return;
    }
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
        setLiveTransactions(list);
        txReady = true;
        checkReady();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, txPath)
    );

    const unsubWallets = onSnapshot(
      query(collection(db, 'users', user.uid, 'wallets'), where('userId', '==', user.uid)),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Wallet));
        setLiveWallets(list);
        walletsReady = true;
        checkReady();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, walletsPath)
    );

    const unsubBudgets = onSnapshot(
      query(collection(db, 'users', user.uid, 'budgets'), where('userId', '==', user.uid)),
      (snap) => {
        setLiveBudgets(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CategoryBudget)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, budgetsPath)
    );

    const unsubGoals = onSnapshot(
      query(collection(db, 'users', user.uid, 'savingsGoals'), where('userId', '==', user.uid)),
      (snap) => {
        setLiveGoals(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavingsGoal)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, goalsPath)
    );

    const unsubChallenges = onSnapshot(
      query(collection(db, 'users', user.uid, 'challenges'), where('userId', '==', user.uid)),
      (snap) => {
        setLiveChallenges(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Challenge)));
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
        setLiveNotifications(list);
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
  }, [isDemo, user]);

  // Unified active dataset (demo vs authenticated Firestore)
  const activeProfile: UserProfile | null = isDemo ? demoData.profile : liveProfile;
  const transactions = isDemo ? demoData.transactions : liveTransactions;
  const wallets = isDemo ? demoData.wallets : liveWallets;
  const budgets = isDemo ? demoData.budgets : liveBudgets;
  const goals = isDemo ? demoData.goals : liveGoals;
  const challenges = isDemo ? demoData.challenges : liveChallenges;
  const notifications = isDemo ? demoData.notifications : liveNotifications;

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

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

  // Automated smart notification alerts (deduplicated, works in both Live & Demo mode)
  useEffect(() => {
    if (!activeProfile || loadingData) return;
    if (!isDemo && !user) return;

    const existingKeys = new Set(notifications.map((n) => n.dedupeKey));
    const dispatchOnce = (
      dedupeKey: string,
      payload: { title: string; message: string; kind: AppNotification['kind'] }
    ) => {
      const safeKey = dedupeKey.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 80);
      if (existingKeys.has(safeKey) || dispatchedNotifKeys.current.has(safeKey)) return;
      dispatchedNotifKeys.current.add(safeKey);

      if (isDemo) {
        const nowTs = Timestamp.now();
        setDemoData((prev) => {
          if (prev.notifications.some((n) => n.dedupeKey === safeKey)) return prev;
          return {
            ...prev,
            notifications: [
              {
                id: safeKey,
                userId: prev.profile.uid,
                title: payload.title,
                message: payload.message,
                kind: payload.kind,
                dedupeKey: safeKey,
                read: false,
                createdAt: nowTs,
                updatedAt: nowTs,
              },
              ...prev.notifications,
            ],
          };
        });
      } else if (user) {
        void createNotificationIfNew(user.uid, { dedupeKey: safeKey, ...payload });
      }
    };

    const currency = activeProfile.currency || 'INR';
    const currentMonthTxs = transactions.filter((t) => t.monthKey === monthKey);
    const currentMonthExpenses = currentMonthTxs.filter((t) => t.type === 'expense');
    const totalSpent = currentMonthExpenses.reduce((s, t) => s + t.amount, 0);

    // 1. Budget threshold notifications (70%, 90%, 100%)
    if (activeProfile.notificationPrefs?.budgetAlerts) {
      if (activeProfile.monthlyBudget > 0) {
        const monthlyPct = (totalSpent / activeProfile.monthlyBudget) * 100;
        if (monthlyPct >= 100) {
          dispatchOnce(`monthly_${monthKey}_100`, {
            title: 'Monthly Budget Exceeded',
            message: `You have spent ${formatCurrency(totalSpent, currency)} against your ${formatCurrency(activeProfile.monthlyBudget, currency)} cap for ${formatMonthLabel(monthKey)}.`,
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
    if (activeProfile.notificationPrefs?.goalMilestones) {
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
    if (activeProfile.notificationPrefs?.challengeAlerts) {
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
    if (activeProfile.notificationPrefs?.inactivityReminders && transactions.length > 0) {
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
  }, [
    isDemo,
    user,
    activeProfile,
    loadingData,
    transactions,
    budgets,
    goals,
    challenges,
    monthKey,
    notifications,
  ]);

  if (!activeProfile) return null;

  const currency = activeProfile.currency || 'INR';

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

  const handleResetDemoData = () => {
    dispatchedNotifKeys.current.clear();
    setDemoData(createInitialDemoDataset(monthKey));
  };

  const handleSeedDemo = async () => {
    setSeedingDemo(true);
    try {
      if (isDemo) {
        handleResetDemoData();
      } else if (user) {
        await seedDemoCampusData(user.uid, monthKey);
      }
    } finally {
      setSeedingDemo(false);
    }
  };

  const handleExitOrLogout = () => {
    if (isDemo) {
      exitDemoMode();
    } else {
      void logout();
    }
  };

  // Unified CRUD adapters for Live (Firestore) vs Demo (Browser Memory)
  const handleSaveTransaction = async (
    data: Parameters<typeof addTransaction>[1]
  ): Promise<void> => {
    if (isDemo) {
      const nowTs = Timestamp.now();
      const monthKeyVal = data.date.slice(0, 7);
      if (editingTx) {
        setDemoData((prev) => ({
          ...prev,
          transactions: prev.transactions
            .map((t) =>
              t.id === editingTx.id
                ? {
                    ...t,
                    ...data,
                    category: data.type === 'transfer' ? 'wallet_transfer' : data.category,
                    monthKey: monthKeyVal,
                    tags: data.tags || [],
                    updatedAt: nowTs,
                  }
                : t
            )
            .sort((a, b) => b.date.localeCompare(a.date)),
        }));
      } else {
        const newTx: Transaction = {
          id: `demo_tx_${Date.now()}`,
          userId: demoData.profile.uid,
          type: data.type,
          amount: data.amount,
          description: data.description,
          category: data.type === 'transfer' ? 'wallet_transfer' : data.category,
          date: data.date,
          monthKey: monthKeyVal,
          paymentMethod: data.paymentMethod,
          walletId: data.walletId,
          toWalletId: data.type === 'transfer' ? data.toWalletId : undefined,
          notes: data.notes,
          tags: data.tags || [],
          receiptName: data.receiptName,
          receiptDataUrl: data.receiptDataUrl,
          createdAt: nowTs,
          updatedAt: nowTs,
        };
        setDemoData((prev) => ({
          ...prev,
          transactions: [newTx, ...prev.transactions].sort((a, b) =>
            b.date.localeCompare(a.date)
          ),
        }));
      }
      return;
    }

    if (!user) return;
    if (editingTx) {
      await updateTransaction(user.uid, editingTx.id, data);
    } else {
      await addTransaction(user.uid, data);
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (isDemo) {
      setDemoData((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== txId),
      }));
      return;
    }
    if (user) await deleteTransaction(user.uid, txId);
  };

  const handleUpdateProfile = async (
    input: Parameters<typeof updateUserProfile>[1]
  ): Promise<void> => {
    if (isDemo) {
      setDemoData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          ...input,
          updatedAt: Timestamp.now(),
        },
      }));
      return;
    }
    if (user) await updateUserProfile(user.uid, input);
  };

  const handleUpdateTheme = async (theme: ThemeMode) => {
    if (isDemo) {
      setDemoData((prev) => ({
        ...prev,
        profile: { ...prev.profile, theme, updatedAt: Timestamp.now() },
      }));
      return;
    }
    if (user) await updateThemeMode(user.uid, theme);
  };

  const handleUpdateNotificationPrefs = async (prefs: NotificationPrefs) => {
    if (isDemo) {
      setDemoData((prev) => ({
        ...prev,
        profile: { ...prev.profile, notificationPrefs: prefs, updatedAt: Timestamp.now() },
      }));
      return;
    }
    if (user) await updateNotificationPrefs(user.uid, prefs);
  };

  const handleToggleArticleRead = async (articleId: string) => {
    if (isDemo) {
      setDemoData((prev) => {
        const cur = prev.profile.readArticleIds || [];
        const next = cur.includes(articleId)
          ? cur.filter((id) => id !== articleId)
          : [...cur, articleId];
        return {
          ...prev,
          profile: { ...prev.profile, readArticleIds: next, updatedAt: Timestamp.now() },
        };
      });
      return;
    }
    if (user) await toggleArticleRead(user.uid, activeProfile.readArticleIds || [], articleId);
  };

  const handleSelectPlan = async (
    plan: PlanTier,
    cycle: 'none' | 'monthly' | 'annual',
    priceInr: number
  ) => {
    if (isDemo) {
      setDemoData((prev) => ({
        ...prev,
        profile: { ...prev.profile, planTier: plan, updatedAt: Timestamp.now() },
      }));
      return;
    }
    if (user) await selectSubscriptionPlan(user.uid, plan, cycle, priceInr);
  };

  const handleSaveCategoryBudget = async (category: ExpenseCategory, limitAmount: number) => {
    if (isDemo) {
      const id = `${monthKey}_${category}`;
      const nowTs = Timestamp.now();
      setDemoData((prev) => {
        const exists = prev.budgets.some((b) => b.id === id);
        if (exists) {
          return {
            ...prev,
            budgets: prev.budgets.map((b) =>
              b.id === id ? { ...b, limitAmount, updatedAt: nowTs } : b
            ),
          };
        }
        return {
          ...prev,
          budgets: [
            ...prev.budgets,
            {
              id,
              userId: prev.profile.uid,
              monthKey,
              category,
              limitAmount,
              createdAt: nowTs,
              updatedAt: nowTs,
            },
          ],
        };
      });
      return;
    }
    if (user) await upsertCategoryBudget(user.uid, monthKey, category, limitAmount);
  };

  const handleDeleteCategoryBudget = async (budgetId: string) => {
    if (isDemo) {
      setDemoData((prev) => ({
        ...prev,
        budgets: prev.budgets.filter((b) => b.id !== budgetId),
      }));
      return;
    }
    if (user) await deleteCategoryBudget(user.uid, budgetId);
  };

  const handleCreateWallet = async (input: Parameters<typeof createWallet>[1]) => {
    if (isDemo) {
      const nowTs = Timestamp.now();
      setDemoData((prev) => ({
        ...prev,
        wallets: [
          ...prev.wallets,
          {
            id: `demo_wallet_${Date.now()}`,
            userId: prev.profile.uid,
            ...input,
            createdAt: nowTs,
            updatedAt: nowTs,
          },
        ],
      }));
      return;
    }
    if (user) await createWallet(user.uid, input);
  };

  const handleUpdateWallet = async (
    walletId: string,
    input: Parameters<typeof updateWallet>[2]
  ) => {
    if (isDemo) {
      setDemoData((prev) => ({
        ...prev,
        wallets: prev.wallets.map((w) =>
          w.id === walletId ? { ...w, ...input, updatedAt: Timestamp.now() } : w
        ),
      }));
      return;
    }
    if (user) await updateWallet(user.uid, walletId, input);
  };

  const handleDeleteWallet = async (walletId: string) => {
    if (isDemo) {
      setDemoData((prev) => ({
        ...prev,
        wallets: prev.wallets.filter((w) => w.id !== walletId),
      }));
      return;
    }
    if (user) await deleteWallet(user.uid, walletId);
  };

  const handleCreateGoal = async (input: Parameters<typeof createSavingsGoal>[1]) => {
    if (isDemo) {
      const nowTs = Timestamp.now();
      const status = input.savedAmount >= input.targetAmount ? 'completed' : 'active';
      setDemoData((prev) => ({
        ...prev,
        goals: [
          ...prev.goals,
          {
            id: `demo_goal_${Date.now()}`,
            userId: prev.profile.uid,
            ...input,
            status,
            createdAt: nowTs,
            updatedAt: nowTs,
          },
        ],
      }));
      return;
    }
    if (user) await createSavingsGoal(user.uid, input);
  };

  const handleUpdateGoal = async (
    goalId: string,
    input: Parameters<typeof updateSavingsGoalDetails>[2]
  ) => {
    if (isDemo) {
      setDemoData((prev) => ({
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === goalId
            ? {
                ...g,
                name: input.name,
                targetAmount: input.targetAmount,
                targetDate: input.targetDate,
                category: input.category,
                status: g.savedAmount >= input.targetAmount ? 'completed' : 'active',
                updatedAt: Timestamp.now(),
              }
            : g
        ),
      }));
      return;
    }
    if (user) await updateSavingsGoalDetails(user.uid, goalId, input);
  };

  const handleAdjustGoal = async (
    goalId: string,
    currentSaved: number,
    targetAmount: number,
    delta: number
  ) => {
    if (isDemo) {
      const nextSaved = Math.max(0, currentSaved + delta);
      const nextStatus = nextSaved >= targetAmount ? 'completed' : 'active';
      setDemoData((prev) => ({
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === goalId
            ? { ...g, savedAmount: nextSaved, status: nextStatus, updatedAt: Timestamp.now() }
            : g
        ),
      }));
      return;
    }
    if (user) await adjustGoalBalance(user.uid, goalId, currentSaved, targetAmount, delta);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (isDemo) {
      setDemoData((prev) => ({
        ...prev,
        goals: prev.goals.filter((g) => g.id !== goalId),
      }));
      return;
    }
    if (user) await deleteSavingsGoal(user.uid, goalId);
  };

  const handleStartChallenge = async (tpl: Parameters<typeof startChallenge>[1]) => {
    if (isDemo) {
      const nowTs = Timestamp.now();
      const start = getTodayISO();
      const endObj = new Date();
      endObj.setDate(endObj.getDate() + tpl.targetDays);
      setDemoData((prev) => ({
        ...prev,
        challenges: [
          ...prev.challenges,
          {
            id: `demo_ch_${Date.now()}`,
            userId: prev.profile.uid,
            templateId: tpl.templateId,
            title: tpl.title,
            description: tpl.description,
            targetDays: tpl.targetDays,
            startDate: start,
            endDate: endObj.toISOString().slice(0, 10),
            completedDays: [],
            pointsReward: tpl.pointsReward,
            status: 'active',
            createdAt: nowTs,
            updatedAt: nowTs,
          },
        ],
      }));
      return;
    }
    if (user) await startChallenge(user.uid, tpl);
  };

  const handleToggleCheckIn = async (
    challengeId: string,
    completedDays: string[],
    targetDays: number,
    dateISO: string
  ) => {
    if (isDemo) {
      const exists = completedDays.includes(dateISO);
      const nextDays = exists
        ? completedDays.filter((d) => d !== dateISO)
        : [...completedDays, dateISO];
      const nextStatus = nextDays.length >= targetDays ? 'completed' : 'active';
      setDemoData((prev) => ({
        ...prev,
        challenges: prev.challenges.map((c) =>
          c.id === challengeId
            ? { ...c, completedDays: nextDays, status: nextStatus, updatedAt: Timestamp.now() }
            : c
        ),
      }));
      return;
    }
    if (user) {
      await toggleChallengeCheckIn(user.uid, challengeId, completedDays, targetDays, dateISO);
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (isDemo) {
      setDemoData((prev) => ({
        ...prev,
        challenges: prev.challenges.filter((c) => c.id !== challengeId),
      }));
      return;
    }
    if (user) await deleteChallenge(user.uid, challengeId);
  };

  const handleMarkNotificationRead = async (notifId: string) => {
    if (isDemo) {
      setDemoData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === notifId ? { ...n, read: true } : n
        ),
      }));
      return;
    }
    if (user) await markNotificationRead(user.uid, notifId);
  };

  const handleDeleteNotification = async (notifId: string) => {
    if (isDemo) {
      setDemoData((prev) => ({
        ...prev,
        notifications: prev.notifications.filter((n) => n.id !== notifId),
      }));
      return;
    }
    if (user) await deleteNotification(user.uid, notifId);
  };

  const initials = (activeProfile.displayName || 'CS')
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
            <span className="truncate">{activeProfile.displayName}</span>
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
              {activeProfile.planTier === 'free' ? 'Free' : 'Plus'}
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
            onClick={handleExitOrLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[#E56B6F] hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>{isDemo ? 'Exit Demo' : 'Logout'}</span>
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
                  onClick={handleExitOrLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#E56B6F] hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{isDemo ? 'Exit Demo' : 'Logout'}</span>
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
              <p className="text-[11px] text-[#8490A5] truncate">{activeProfile.campusName}</p>
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
                void handleUpdateTheme(activeProfile.theme === 'dark' ? 'light' : 'dark')
              }
              className="hidden sm:inline-flex p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-[#8490A5] hover:text-[#172B4D] dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
              aria-label="Toggle color theme"
              title={activeProfile.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {activeProfile.theme === 'dark' ? (
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
                            if (!n.read) void handleMarkNotificationRead(n.id);
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
                              void handleDeleteNotification(n.id);
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
              title={`${activeProfile.displayName} — Open Settings`}
            >
              {activeProfile.photoURL ? (
                <img
                  src={activeProfile.photoURL}
                  alt={activeProfile.displayName}
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
        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-10 max-w-7xl w-full mx-auto space-y-5">
          {/* Interactive Demo Banner */}
          {isDemo && (
            <div className="bg-[#172B4D] text-white rounded-2xl px-4 sm:px-5 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-xs">
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#18A879]">
                  Interactive Demo Mode · No Login Required
                </p>
                <p className="text-xs text-slate-200 mt-0.5">
                  You are exploring sample Dehradun student finances. Add transactions, edit budgets, or test goals freely—changes stay in this browser session.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetDemoData}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Demo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoAuthOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#18A879] hover:bg-[#149369] text-xs font-semibold text-white transition-colors whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign Up / Save Account</span>
                </button>
                <button
                  type="button"
                  onClick={exitDemoMode}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white whitespace-nowrap"
                >
                  Exit
                </button>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <OverviewTab
              monthKey={monthKey}
              currency={currency}
              monthlyBudget={activeProfile.monthlyBudget}
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
              onDeleteTx={handleDeleteTransaction}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsTab
              monthKey={monthKey}
              currency={currency}
              monthlyBudget={activeProfile.monthlyBudget}
              transactions={transactions}
              budgets={budgets}
              onSaveMonthlyBudget={(nextBudget) =>
                handleUpdateProfile({
                  displayName: activeProfile.displayName,
                  campusName: activeProfile.campusName,
                  ageGroup: activeProfile.ageGroup,
                  currency: activeProfile.currency,
                  monthlyAllowance: activeProfile.monthlyAllowance,
                  monthlyBudget: nextBudget,
                  savingsTarget: activeProfile.savingsTarget,
                  photoURL: activeProfile.photoURL,
                })
              }
              onSaveCategoryBudget={handleSaveCategoryBudget}
              onDeleteCategoryBudget={handleDeleteCategoryBudget}
            />
          )}

          {activeTab === 'wallets' && (
            <WalletsTab
              currency={currency}
              wallets={wallets}
              transactions={transactions}
              onCreateWallet={handleCreateWallet}
              onUpdateWallet={handleUpdateWallet}
              onDeleteWallet={handleDeleteWallet}
              onOpenTransfer={() => openAddTxModal('transfer')}
              onViewWalletTransactions={handleViewWalletTransactions}
            />
          )}

          {activeTab === 'goals' && (
            <SavingsGoalsTab
              currency={currency}
              goals={goals}
              onCreateGoal={handleCreateGoal}
              onUpdateGoal={handleUpdateGoal}
              onAdjustGoal={handleAdjustGoal}
              onDeleteGoal={handleDeleteGoal}
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
              onStartChallenge={handleStartChallenge}
              onToggleCheckIn={handleToggleCheckIn}
              onDeleteChallenge={handleDeleteChallenge}
            />
          )}

          {activeTab === 'learn' && (
            <LearnFinanceTab
              readArticleIds={activeProfile.readArticleIds || []}
              onToggleArticleRead={handleToggleArticleRead}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              profile={activeProfile}
              transactions={transactions}
              seedingDemo={seedingDemo}
              onUpdateProfile={handleUpdateProfile}
              onUpdateTheme={handleUpdateTheme}
              onUpdateNotificationPrefs={handleUpdateNotificationPrefs}
              onChangePassword={async (pw) => {
                if (isDemo) {
                  throw new Error(
                    'Password management requires a signed-in account. Click "Sign Up / Save Account" above.'
                  );
                }
                await changePassword(pw);
              }}
              onSendPasswordReset={async (email) => {
                if (isDemo) return false;
                return sendResetPasswordEmail(email);
              }}
              onSeedDemo={handleSeedDemo}
              onDeleteAccount={async () => {
                if (isDemo) {
                  exitDemoMode();
                  return;
                }
                await deleteAccount();
              }}
            />
          )}

          {activeTab === 'subscription' && (
            <SubscriptionTab
              currentPlan={activeProfile.planTier || 'free'}
              onSelectPlan={handleSelectPlan}
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
        onSave={handleSaveTransaction}
      />

      {/* Sign Up Modal available straight from Demo Mode */}
      {isDemo && (
        <AuthModal
          isOpen={demoAuthOpen}
          initialMode="signup"
          onClose={() => setDemoAuthOpen(false)}
        />
      )}
    </div>
  );
}
