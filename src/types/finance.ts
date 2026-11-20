import { Timestamp } from 'firebase/firestore';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'campus'
  | 'entertainment'
  | 'subscriptions'
  | 'shopping'
  | 'hostel'
  | 'other';

export type PaymentMethod = 'upi' | 'cash' | 'card';

export type GoalCategory = 'travel' | 'tech' | 'academics' | 'emergency' | 'lifestyle';

export type RecordStatus = 'active' | 'completed';

export type PlanTier = 'free' | 'campus_plus_interest';

export const MAX_DISPLAY_NAME_LENGTH = 80;
export const MAX_CAMPUS_NAME_LENGTH = 100;
export const MAX_NOTE_LENGTH = 140;
export const MAX_GOAL_TITLE_LENGTH = 60;
export const MAX_CHALLENGE_TITLE_LENGTH = 80;
export const MAX_ALLOWANCE_AMOUNT = 1000000;
export const MAX_EXPENSE_AMOUNT = 1000000;
export const MAX_GOAL_AMOUNT = 10000000;
export const MAX_CHALLENGE_DAYS = 90;

export const DATE_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
export const MONTH_KEY_REGEX = /^[0-9]{4}-[0-9]{2}$/;
export const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  campusName: string;
  monthlyAllowance: number;
  planTier: PlanTier;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  note: string;
  date: string;
  monthKey: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface CategoryBudget {
  id: string;
  userId: string;
  monthKey: string;
  category: ExpenseCategory;
  limitAmount: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string;
  category: GoalCategory;
  status: RecordStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface HabitChallenge {
  id: string;
  userId: string;
  templateId: string;
  title: string;
  targetDays: number;
  completedDays: string[];
  status: RecordStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface CategoryMeta {
  id: ExpenseCategory;
  label: string;
  shortLabel: string;
  defaultCap: number;
  examples: string;
  barColor: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'food',
    label: 'Food & Chai',
    shortLabel: 'Food',
    defaultCap: 2500,
    examples: 'Canteen, Maggi point, chai, tiffin',
    barColor: '#0F766E',
  },
  {
    id: 'transport',
    label: 'Transport & Auto',
    shortLabel: 'Transport',
    defaultCap: 900,
    examples: 'Vikram auto, bus pass, metro, fuel',
    barColor: '#0284C7',
  },
  {
    id: 'campus',
    label: 'Campus & Books',
    shortLabel: 'Campus',
    defaultCap: 1000,
    examples: 'Printouts, notebooks, lab fees, books',
    barColor: '#4F46E5',
  },
  {
    id: 'entertainment',
    label: 'Hangouts & Fun',
    shortLabel: 'Hangouts',
    defaultCap: 1000,
    examples: 'Movies, cafe outing, fest tickets',
    barColor: '#D97706',
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    shortLabel: 'Subs',
    defaultCap: 400,
    examples: 'Mobile recharge, Spotify, cloud storage',
    barColor: '#0D9488',
  },
  {
    id: 'shopping',
    label: 'Shopping & Care',
    shortLabel: 'Shopping',
    defaultCap: 1200,
    examples: 'Toiletries, apparel, hostel essentials',
    barColor: '#E11D48',
  },
  {
    id: 'hostel',
    label: 'Hostel & Utilities',
    shortLabel: 'Hostel',
    defaultCap: 700,
    examples: 'Laundry, drinking water, room supplies',
    barColor: '#475569',
  },
  {
    id: 'other',
    label: 'Other',
    shortLabel: 'Other',
    defaultCap: 300,
    examples: 'Gifts, miscellaneous small spends',
    barColor: '#64748B',
  },
];

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'upi', label: 'UPI' },
  { id: 'cash', label: 'Cash' },
  { id: 'card', label: 'Card' },
];

export const GOAL_CATEGORIES: { id: GoalCategory; label: string }[] = [
  { id: 'travel', label: 'Campus Trip' },
  { id: 'tech', label: 'Gadget & Tech' },
  { id: 'academics', label: 'Books & Courses' },
  { id: 'emergency', label: 'Emergency Cushion' },
  { id: 'lifestyle', label: 'Personal Goal' },
];

export interface ChallengeTemplate {
  templateId: string;
  title: string;
  targetDays: number;
  summary: string;
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    templateId: 'no_delivery_7d',
    title: '7-Day No Food Delivery',
    targetDays: 7,
    summary: 'Eat at mess/canteen or cook simple meals instead of ordering online.',
  },
  {
    templateId: 'daily_log_14d',
    title: '14-Day Every Rupee Logged',
    targetDays: 14,
    summary: 'Record every UPI and cash purchase under 15 seconds each day.',
  },
  {
    templateId: 'chai_cap_5d',
    title: '5-Day Snack Cap Under Rs. 60',
    targetDays: 5,
    summary: 'Keep impulse chai, coffee, and canteen snacks under Rs. 60 per day.',
  },
  {
    templateId: 'zero_spend_weekend',
    title: 'Weekend Zero-Spend Reset',
    targetDays: 2,
    summary: 'Spend Rs. 0 on discretionary outings for one Saturday and Sunday.',
  },
];

export function formatINR(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(safe));
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentMonthKey(): string {
  return getTodayISO().slice(0, 7);
}

export function formatMonthLabel(monthKey: string): string {
  if (!MONTH_KEY_REGEX.test(monthKey)) return monthKey;
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getDaysInMonth(monthKey: string): number {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

export function getRemainingDaysInMonth(monthKey: string): number {
  const todayKey = getCurrentMonthKey();
  const totalDays = getDaysInMonth(monthKey);
  if (monthKey > todayKey) return totalDays;
  if (monthKey < todayKey) return 1;
  const todayDay = new Date().getDate();
  return Math.max(1, totalDays - todayDay + 1);
}

export function getCategoryMeta(category: ExpenseCategory): CategoryMeta {
  return CATEGORIES.find((c) => c.id === category) ?? CATEGORIES[CATEGORIES.length - 1];
}
