import { Timestamp } from 'firebase/firestore';
import {
  AppNotification,
  CategoryBudget,
  Challenge,
  ExpenseCategory,
  getCurrentMonthKey,
  getTodayISO,
  PaymentMethod,
  SavingsGoal,
  shiftMonthKey,
  Transaction,
  TransactionType,
  TxCategory,
  UserProfile,
  Wallet,
  WalletType,
} from '../types/finance';

export interface DemoDataset {
  profile: UserProfile;
  wallets: Wallet[];
  transactions: Transaction[];
  budgets: CategoryBudget[];
  goals: SavingsGoal[];
  challenges: Challenge[];
  notifications: AppNotification[];
}

export function createInitialDemoDataset(monthKey: string = getCurrentMonthKey()): DemoDataset {
  const prevMonth = shiftMonthKey(monthKey, -1);
  const todayISO = getTodayISO();
  const day = (m: string, d: number) => `${m}-${String(d).padStart(2, '0')}`;
  const nowTs = Timestamp.now();

  const profile: UserProfile = {
    uid: 'demo_student_uid',
    displayName: 'Aarav Sharma (Demo)',
    email: 'demo@fintrackcampus.in',
    campusName: 'DBS Global University, Dehradun',
    ageGroup: '18-20',
    currency: 'INR',
    monthlyAllowance: 20000,
    monthlyBudget: 15000,
    savingsTarget: 5000,
    onboardingCompleted: true,
    planTier: 'free',
    theme: 'light',
    readArticleIds: ['what_is_budgeting'],
    notificationPrefs: {
      budgetAlerts: true,
      inactivityReminders: true,
      goalMilestones: true,
      challengeAlerts: true,
    },
    createdAt: nowTs,
    updatedAt: nowTs,
  };

  const walletDefs: { id: string; name: string; type: WalletType; color: string }[] = [
    { id: 'wallet_upi', name: 'UPI Wallet', type: 'upi', color: '#18A879' },
    { id: 'wallet_cash', name: 'Cash Wallet', type: 'cash', color: '#F4B544' },
    { id: 'wallet_bank', name: 'Bank Account', type: 'bank', color: '#172B4D' },
    { id: 'wallet_savings', name: 'Savings Wallet', type: 'savings', color: '#4778E8' },
  ];

  const wallets: Wallet[] = walletDefs.map((w) => ({
    id: w.id,
    userId: profile.uid,
    name: w.name,
    type: w.type,
    openingBalance: 0,
    color: w.color,
    createdAt: nowTs,
    updatedAt: nowTs,
  }));

  const rawTxs: {
    type: TransactionType;
    amount: number;
    description: string;
    category: TxCategory;
    date: string;
    paymentMethod: PaymentMethod;
    walletId: string;
    toWalletId?: string;
    tags: string[];
    notes?: string;
  }[] = [
    {
      type: 'income',
      amount: 20000,
      description: 'Monthly Family Allowance',
      category: 'allowance_income',
      date: day(monthKey, 1),
      paymentMethod: 'bank_transfer',
      walletId: 'wallet_bank',
      tags: ['allowance'],
      notes: 'Monthly support from parents for hostel & campus living.',
    },
    {
      type: 'transfer',
      amount: 9000,
      description: 'Move spending money to UPI Wallet',
      category: 'wallet_transfer',
      date: day(monthKey, 1),
      paymentMethod: 'upi',
      walletId: 'wallet_bank',
      toWalletId: 'wallet_upi',
      tags: ['transfer'],
    },
    {
      type: 'transfer',
      amount: 5000,
      description: 'Pay yourself first — Savings transfer',
      category: 'wallet_transfer',
      date: day(monthKey, 2),
      paymentMethod: 'bank_transfer',
      walletId: 'wallet_bank',
      toWalletId: 'wallet_savings',
      tags: ['savings'],
    },
    {
      type: 'transfer',
      amount: 2000,
      description: 'ATM cash withdrawal for campus',
      category: 'wallet_transfer',
      date: day(monthKey, 2),
      paymentMethod: 'cash',
      walletId: 'wallet_bank',
      toWalletId: 'wallet_cash',
      tags: ['atm'],
    },
    {
      type: 'expense',
      amount: 1450,
      description: 'Campus mess & canteen meals',
      category: 'food_dining',
      date: day(monthKey, 4),
      paymentMethod: 'upi',
      walletId: 'wallet_upi',
      tags: ['canteen'],
    },
    {
      type: 'expense',
      amount: 1050,
      description: 'Maggi point, chai & cafe with friends',
      category: 'food_dining',
      date: day(monthKey, 11),
      paymentMethod: 'upi',
      walletId: 'wallet_upi',
      tags: ['chai', 'snacks'],
    },
    {
      type: 'expense',
      amount: 750,
      description: 'Dehradun city bus & Vikram auto pass',
      category: 'transportation',
      date: day(monthKey, 5),
      paymentMethod: 'cash',
      walletId: 'wallet_cash',
      tags: ['commute'],
    },
    {
      type: 'expense',
      amount: 450,
      description: 'Shared cab to ISBT & Clock Tower',
      category: 'transportation',
      date: day(monthKey, 13),
      paymentMethod: 'upi',
      walletId: 'wallet_upi',
      tags: ['travel'],
    },
    {
      type: 'expense',
      amount: 1500,
      description: 'Winter hoodie & hostel essentials',
      category: 'shopping',
      date: day(monthKey, 8),
      paymentMethod: 'debit_card',
      walletId: 'wallet_bank',
      tags: ['apparel'],
    },
    {
      type: 'expense',
      amount: 800,
      description: 'Pacific Mall cinema & snacks',
      category: 'entertainment',
      date: day(monthKey, 14),
      paymentMethod: 'upi',
      walletId: 'wallet_upi',
      tags: ['weekend'],
    },
    {
      type: 'expense',
      amount: 1000,
      description: 'Finance textbooks & spiral printouts',
      category: 'education',
      date: day(monthKey, 6),
      paymentMethod: 'upi',
      walletId: 'wallet_upi',
      tags: ['books'],
    },
    {
      type: 'expense',
      amount: 500,
      description: 'Hostel laundry & club contribution',
      category: 'other',
      date: day(monthKey, 16),
      paymentMethod: 'cash',
      walletId: 'wallet_cash',
      tags: ['hostel'],
    },
    {
      type: 'income',
      amount: 18000,
      description: 'Last month allowance',
      category: 'allowance_income',
      date: day(prevMonth, 1),
      paymentMethod: 'bank_transfer',
      walletId: 'wallet_bank',
      tags: ['allowance'],
    },
    {
      type: 'expense',
      amount: 2150,
      description: 'Last month canteen & dining',
      category: 'food_dining',
      date: day(prevMonth, 9),
      paymentMethod: 'upi',
      walletId: 'wallet_upi',
      tags: ['canteen'],
    },
    {
      type: 'expense',
      amount: 1350,
      description: 'Last month auto & bus commute',
      category: 'transportation',
      date: day(prevMonth, 15),
      paymentMethod: 'cash',
      walletId: 'wallet_cash',
      tags: ['commute'],
    },
    {
      type: 'expense',
      amount: 950,
      description: 'Last month course material',
      category: 'education',
      date: day(prevMonth, 18),
      paymentMethod: 'upi',
      walletId: 'wallet_upi',
      tags: ['books'],
    },
  ];

  const transactions: Transaction[] = rawTxs
    .map((tx, idx) => ({
      id: `demo_tx_${idx + 1}`,
      userId: profile.uid,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      category: tx.category,
      date: tx.date,
      monthKey: tx.date.slice(0, 7),
      paymentMethod: tx.paymentMethod,
      walletId: tx.walletId,
      toWalletId: tx.toWalletId,
      notes: tx.notes,
      tags: tx.tags,
      createdAt: nowTs,
      updatedAt: nowTs,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const budgetDefs: { category: ExpenseCategory; limit: number }[] = [
    { category: 'food_dining', limit: 4000 },
    { category: 'transportation', limit: 2000 },
    { category: 'shopping', limit: 2000 },
    { category: 'education', limit: 3000 },
    { category: 'entertainment', limit: 1000 },
    { category: 'other', limit: 3000 },
  ];

  const budgets: CategoryBudget[] = budgetDefs.map((b) => ({
    id: `${monthKey}_${b.category}`,
    userId: profile.uid,
    monthKey,
    category: b.category,
    limitAmount: b.limit,
    createdAt: nowTs,
    updatedAt: nowTs,
  }));

  const goals: SavingsGoal[] = [
    {
      id: 'demo_goal_laptop',
      userId: profile.uid,
      name: 'Buy a Laptop',
      targetAmount: 60000,
      savedAmount: 18000,
      targetDate: day(shiftMonthKey(monthKey, 6), 15),
      category: 'laptop',
      status: 'active',
      createdAt: nowTs,
      updatedAt: nowTs,
    },
    {
      id: 'demo_goal_emergency',
      userId: profile.uid,
      name: 'Emergency Fund',
      targetAmount: 10000,
      savedAmount: 4500,
      targetDate: day(shiftMonthKey(monthKey, 3), 25),
      category: 'emergency',
      status: 'active',
      createdAt: nowTs,
      updatedAt: nowTs,
    },
  ];

  const challenges: Challenge[] = [
    {
      id: 'demo_challenge_1',
      userId: profile.uid,
      templateId: 'save_50_daily_7d',
      title: 'Save ₹50 Every Day',
      description: 'Skip one impulse chai/snack purchase and stash ₹50 daily for a week.',
      targetDays: 7,
      startDate: day(monthKey, 1),
      endDate: day(monthKey, 8),
      completedDays: [day(monthKey, 1), day(monthKey, 2), day(monthKey, 3)],
      pointsReward: 120,
      status: 'active',
      createdAt: nowTs,
      updatedAt: nowTs,
    },
  ];

  const notifications: AppNotification[] = [
    {
      id: `demo_welcome_${todayISO}`,
      userId: profile.uid,
      title: 'Interactive Demo Active',
      message:
        'Try adding expenses, moving funds between wallets, checking off challenges, or editing budgets. Sign up free anytime to save your real data.',
      kind: 'system',
      dedupeKey: `demo_welcome_${todayISO}`,
      read: false,
      createdAt: nowTs,
      updatedAt: nowTs,
    },
  ];

  return {
    profile,
    wallets,
    transactions,
    budgets,
    goals,
    challenges,
    notifications,
  };
}
