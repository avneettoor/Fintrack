import { Timestamp } from 'firebase/firestore';

export type TransactionType = 'expense' | 'income' | 'transfer';

export type ExpenseCategory =
  | 'food_dining'
  | 'transportation'
  | 'shopping'
  | 'entertainment'
  | 'education'
  | 'accommodation'
  | 'groceries'
  | 'subscriptions'
  | 'personal_care'
  | 'other';

export type TxCategory =
  | ExpenseCategory
  | 'allowance_income'
  | 'freelance_income'
  | 'wallet_transfer';

export type PaymentMethod =
  | 'upi'
  | 'cash'
  | 'debit_card'
  | 'credit_card'
  | 'bank_transfer'
  | 'other';

export type WalletType = 'cash' | 'bank' | 'upi' | 'savings' | 'college' | 'personal';

export type GoalCategory = 'laptop' | 'smartphone' | 'emergency' | 'trip' | 'clothes' | 'personal';

export type RecordStatus = 'active' | 'completed';

export type PlanTier = 'free' | 'premium_monthly' | 'premium_annual';

export type CurrencyCode = 'INR' | 'USD' | 'EUR';

export type AgeGroup = '18-20' | '21-22' | '23-25' | '25+';

export type ThemeMode = 'light' | 'dark';

export type NotificationKind =
  | 'budget_warning'
  | 'budget_exceeded'
  | 'goal_milestone'
  | 'challenge_complete'
  | 'inactivity'
  | 'system';

export const MAX_DISPLAY_NAME_LENGTH = 80;
export const MAX_CAMPUS_NAME_LENGTH = 100;
export const MAX_DESC_LENGTH = 140;
export const MAX_NOTES_LENGTH = 300;
export const MAX_WALLET_NAME_LENGTH = 60;
export const MAX_GOAL_NAME_LENGTH = 60;
export const MAX_CHALLENGE_TITLE_LENGTH = 80;
export const MAX_AMOUNT = 10000000;
export const MAX_CHALLENGE_DAYS = 90;

export const DATE_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
export const MONTH_KEY_REGEX = /^[0-9]{4}-[0-9]{2}$/;
export const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;

export interface NotificationPrefs {
  budgetAlerts: boolean;
  inactivityReminders: boolean;
  goalMilestones: boolean;
  challengeAlerts: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  campusName: string;
  ageGroup: AgeGroup;
  currency: CurrencyCode;
  monthlyAllowance: number;
  monthlyBudget: number;
  savingsTarget: number;
  onboardingCompleted: boolean;
  planTier: PlanTier;
  theme: ThemeMode;
  readArticleIds: string[];
  notificationPrefs: NotificationPrefs;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: TxCategory;
  date: string;
  monthKey: string;
  paymentMethod: PaymentMethod;
  walletId: string;
  toWalletId?: string;
  notes?: string;
  tags: string[];
  receiptName?: string;
  receiptDataUrl?: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  type: WalletType;
  openingBalance: number;
  color: string;
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
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string;
  category: GoalCategory;
  status: RecordStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface Challenge {
  id: string;
  userId: string;
  templateId: string;
  title: string;
  description: string;
  targetDays: number;
  startDate: string;
  endDate: string;
  completedDays: string[];
  pointsReward: number;
  status: RecordStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  kind: NotificationKind;
  dedupeKey: string;
  read: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  plan: PlanTier;
  priceInr: number;
  billingCycle: 'none' | 'monthly' | 'annual';
  status: 'active' | 'preview_interest';
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface CategoryMeta {
  id: ExpenseCategory;
  label: string;
  color: string;
  pastelBg: string;
  defaultCap: number;
  examples: string;
}

export const EXPENSE_CATEGORIES: CategoryMeta[] = [
  {
    id: 'food_dining',
    label: 'Food & Dining',
    color: '#18A879',
    pastelBg: '#E8F7F2',
    defaultCap: 4000,
    examples: 'Canteen, Maggi point, chai, cafes',
  },
  {
    id: 'transportation',
    label: 'Transportation',
    color: '#4778E8',
    pastelBg: '#EDF2FD',
    defaultCap: 2000,
    examples: 'Vikram auto, bus pass, metro, cab',
  },
  {
    id: 'shopping',
    label: 'Shopping',
    color: '#E56B6F',
    pastelBg: '#FDEFEF',
    defaultCap: 2000,
    examples: 'Clothes, room accessories, gifts',
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    color: '#F4B544',
    pastelBg: '#FEF7EA',
    defaultCap: 1000,
    examples: 'Movies, fests, gaming, outings',
  },
  {
    id: 'education',
    label: 'Education',
    color: '#6366F1',
    pastelBg: '#EEF2FF',
    defaultCap: 3000,
    examples: 'Books, printouts, courses, stationery',
  },
  {
    id: 'accommodation',
    label: 'Accommodation',
    color: '#0EA5E9',
    pastelBg: '#EBF8FE',
    defaultCap: 0,
    examples: 'Hostel fees, PG rent, electricity',
  },
  {
    id: 'groceries',
    label: 'Groceries',
    color: '#10B981',
    pastelBg: '#ECFDF5',
    defaultCap: 1000,
    examples: 'Milk, fruits, snacks, drinking water',
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    color: '#8B5CF6',
    pastelBg: '#F3EEFE',
    defaultCap: 500,
    examples: 'Mobile data pack, Spotify, cloud',
  },
  {
    id: 'personal_care',
    label: 'Personal Care',
    color: '#EC4899',
    pastelBg: '#FDF2F8',
    defaultCap: 500,
    examples: 'Salon, toiletries, pharmacy, laundry',
  },
  {
    id: 'other',
    label: 'Other',
    color: '#64748B',
    pastelBg: '#F1F5F9',
    defaultCap: 1000,
    examples: 'Miscellaneous student spends',
  },
];

export const INCOME_CATEGORIES: { id: TxCategory; label: string; color: string }[] = [
  { id: 'allowance_income', label: 'Monthly Allowance', color: '#16A36A' },
  { id: 'freelance_income', label: 'Internship / Stipend', color: '#18A879' },
  { id: 'other', label: 'Other Income', color: '#4778E8' },
];

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'upi', label: 'UPI' },
  { id: 'cash', label: 'Cash' },
  { id: 'debit_card', label: 'Debit Card' },
  { id: 'credit_card', label: 'Credit Card' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
  { id: 'other', label: 'Other' },
];

export const WALLET_TYPES: { id: WalletType; label: string; defaultColor: string }[] = [
  { id: 'upi', label: 'UPI Wallet', defaultColor: '#18A879' },
  { id: 'cash', label: 'Cash Wallet', defaultColor: '#F4B544' },
  { id: 'bank', label: 'Bank Account', defaultColor: '#172B4D' },
  { id: 'savings', label: 'Savings Wallet', defaultColor: '#4778E8' },
  { id: 'college', label: 'College Expenses', defaultColor: '#6366F1' },
  { id: 'personal', label: 'Personal Wallet', defaultColor: '#E56B6F' },
];

export const GOAL_CATEGORIES: { id: GoalCategory; label: string; color: string }[] = [
  { id: 'laptop', label: 'Buy a Laptop', color: '#4778E8' },
  { id: 'smartphone', label: 'Smartphone', color: '#172B4D' },
  { id: 'emergency', label: 'Emergency Fund', color: '#18A879' },
  { id: 'trip', label: 'College Trip', color: '#F4B544' },
  { id: 'clothes', label: 'New Clothes', color: '#E56B6F' },
  { id: 'personal', label: 'Personal Savings', color: '#6366F1' },
];

export interface ChallengeTemplate {
  templateId: string;
  title: string;
  description: string;
  targetDays: number;
  pointsReward: number;
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    templateId: 'no_spend_weekend',
    title: 'No-Spend Weekend',
    description: 'Spend ₹0 on discretionary outings, cafes, or shopping across Saturday and Sunday.',
    targetDays: 2,
    pointsReward: 100,
  },
  {
    templateId: 'save_1000_30d',
    title: 'Save ₹1,000 in 30 Days',
    description: 'Set aside ₹35+ daily into your savings wallet or goals for 30 days.',
    targetDays: 30,
    pointsReward: 300,
  },
  {
    templateId: 'reduce_food_20pct',
    title: 'Reduce Food Expenses by 20%',
    description: 'Choose mess/tiffin meals over food delivery apps for 14 consecutive days.',
    targetDays: 14,
    pointsReward: 200,
  },
  {
    templateId: 'track_every_expense_30d',
    title: 'Track Every Expense for 30 Days',
    description: 'Log every UPI, cash, and card transaction daily for a full month.',
    targetDays: 30,
    pointsReward: 350,
  },
  {
    templateId: 'save_50_daily_7d',
    title: 'Save ₹50 Every Day',
    description: 'Skip one impulse chai/snack purchase and stash ₹50 daily for a week.',
    targetDays: 7,
    pointsReward: 120,
  },
  {
    templateId: 'no_shopping_7d',
    title: 'Avoid Unnecessary Shopping for 7 Days',
    description: 'Zero online impulse purchases or non-essential shopping for 7 days.',
    targetDays: 7,
    pointsReward: 150,
  },
];

export interface BadgeDef {
  id: string;
  title: string;
  description: string;
  points: number;
}

export const ACHIEVEMENT_BADGES: BadgeDef[] = [
  { id: 'first_tx', title: 'First Transaction', description: 'Logged your first expense or income', points: 50 },
  { id: 'budget_master', title: 'Budget Master', description: 'Configured 3+ category monthly budgets', points: 100 },
  { id: 'smart_saver', title: 'Smart Saver', description: 'Saved toward an active student goal', points: 100 },
  { id: 'tracker_7d', title: '7-Day Tracker', description: 'Logged transactions on 7 distinct days', points: 150 },
  { id: 'discipline_30d', title: '30-Day Discipline', description: 'Completed a 30-day money challenge', points: 300 },
  { id: 'savings_champ', title: 'Savings Champion', description: 'Reached 100% on a savings goal', points: 250 },
];

export interface FinanceArticle {
  id: string;
  title: string;
  readTime: string;
  topic: string;
  summary: string;
  takeaways: string[];
  body: string[];
}

export const LEARN_ARTICLES: FinanceArticle[] = [
  {
    id: 'what_is_budgeting',
    title: 'What is budgeting?',
    readTime: '3 min read',
    topic: 'Foundations',
    summary: 'Turn a fixed monthly allowance into a clear spending plan without feeling restricted.',
    takeaways: [
      'A budget tells every rupee where to go before the month starts.',
      'Start with fixed hostel/college costs first, then cap food and hangouts.',
      'Review your Safe-to-Spend daily number instead of guessing your bank balance.',
    ],
    body: [
      'Budgeting is simply a plan for your money over the next 30 days. When you live away from home on a fixed monthly allowance, the biggest trap is assuming ₹8,000 or ₹15,000 feels huge on the 1st of the month, only to wonder why it vanished by the 18th.',
      'Divide your allowance into three buckets: Fixed Essentials (mess, transport pass, mobile pack), Flexible Daily Living (food, chai, printouts), and Future You (savings goals and emergency buffer). Even a 10-minute check-in on Sundays prevents end-of-month borrowing.',
    ],
  },
  {
    id: 'save_money_student',
    title: 'How to save money as a student',
    readTime: '4 min read',
    topic: 'Campus Habits',
    summary: 'Practical ways Indian college students save ₹1,500–₹3,000 a month without missing out.',
    takeaways: [
      'Move savings out of your primary UPI wallet on Day 1.',
      'Use student ID discounts on software, transit, and events.',
      'Batch food orders with hostel mates or eat on campus instead of solo delivery fees.',
    ],
    body: [
      'The most reliable student saving habit is paying yourself first. The moment your allowance arrives, transfer ₹500 or ₹1,500 into a separate Savings Wallet so you never accidentally spend it on late-night snacks.',
      'Watch delivery platform convenience fees and surge charges—two ₹220 food orders a week easily cost over ₹1,750 a month. Cooking maggi/oats or sharing tiffins with roommates frees up enough cash for a weekend Rishikesh or Mussoorie trip.',
    ],
  },
  {
    id: 'needs_vs_wants',
    title: 'Needs vs wants',
    readTime: '3 min read',
    topic: 'Decision Making',
    summary: 'A 24-hour rule to separate essential campus expenses from impulse UPI taps.',
    takeaways: [
      'Needs keep you fed, safe, and able to attend classes.',
      'Wants improve comfort or social fun—they belong in a capped entertainment budget.',
      'Wait 24 hours before buying any non-essential item above ₹500.',
    ],
    body: [
      'Needs are expenses you cannot skip without hurting your health or studies: canteen meals, college printouts, shared auto fares, and mobile connectivity. Wants are upgrades: specialty iced coffees, weekend movie combos, or flash-sale sneakers.',
      'You do not have to eliminate wants. Instead, assign a dedicated Hangouts & Shopping cap every month. Once that cap hits 90%, wait until next month rather than dipping into rent or emergency money.',
    ],
  },
  {
    id: 'emergency_funds',
    title: 'Emergency funds',
    readTime: '3 min read',
    topic: 'Safety Net',
    summary: 'Why every hosteler needs a ₹3,000–₹5,000 untouched cushion for surprise expenses.',
    takeaways: [
      'Medical bills, sudden travel home, or phone repairs happen unexpectedly.',
      'Even ₹200 saved each month builds a solid campus cushion within a semester.',
      'Keep emergency funds in a separate Savings Wallet—never in your daily UPI wallet.',
    ],
    body: [
      'An emergency fund is money reserved strictly for unplanned situations: a cracked phone screen, urgent medical tests, or last-minute train tickets home. Without one, a single ₹2,000 surprise forces you to borrow from friends.',
      'Start small. Aim for ₹3,000 as your first milestone—roughly two weeks of bare-minimum student expenses—and replenish it whenever you have to dip into it.',
    ],
  },
  {
    id: 'understanding_upi_spending',
    title: 'Understanding UPI spending',
    readTime: '3 min read',
    topic: 'Digital Payments',
    summary: 'Why frictionless QR scans feel invisible—and how quick logging restores awareness.',
    takeaways: [
      'Twenty ₹30–₹80 QR scans per week quietly exceed ₹1,200/month.',
      'Cash makes spending physically visible; UPI removes that pause.',
      'Logging UPI spends right after scanning keeps your daily budget honest.',
    ],
    body: [
      'UPI made campus life effortless—buying chai, paying auto drivers, splitting momos with friends takes three seconds. Because no paper notes leave your pocket, your brain does not register the cumulative drain.',
      'Checking a bank statement at the end of the month only tells you what already happened. Recording your category right when you pay turns invisible micro-spends into clear patterns you can steer.',
    ],
  },
  {
    id: 'avoid_unnecessary_expenses',
    title: 'How to avoid unnecessary expenses',
    readTime: '4 min read',
    topic: 'Spending Control',
    summary: 'Audit recurring subscriptions, impulse carts, and peer-pressure outings effortlessly.',
    takeaways: [
      'Cancel unused OTT or app trials before auto-debit dates.',
      'Suggest budget-friendly campus hangouts when money is tight.',
      'Track small leaks under ₹150—they are usually the #1 budget killer.',
    ],
    body: [
      'Unnecessary expenses rarely come from one giant purchase; they sneak in through ₹49 app subscriptions you forgot to cancel, ₹60 extra delivery fees, and spontaneous mall trips.',
      'Once a week, open your FinTrack Campus Analytics tab and check your Small-Ticket UPI insights. Simply spotting that snacks and impulse shopping took 35% of your month naturally trims future waste.',
    ],
  },
  {
    id: 'basics_personal_finance',
    title: 'Basics of personal finance',
    readTime: '4 min read',
    topic: 'Foundations',
    summary: 'Cashflow, net savings rate, and tracking assets vs obligations in plain English.',
    takeaways: [
      'Income minus Expenses equals Savings—never spend first and save leftovers.',
      'Aim for a 15–20% savings rate on any stipend, internship, or allowance.',
      'Keep transfers between your own accounts separate from real spending.',
    ],
    body: [
      'Personal finance boils down to three numbers: how much comes in (Income), how much goes out (Expenses), and how much stays with you (Savings).',
      'Mastering these habits with a ₹10,000 student allowance prepares you far better for your first ₹60,000/month job than any textbook formula.',
    ],
  },
  {
    id: 'how_compound_interest_works',
    title: 'How compound interest works',
    readTime: '4 min read',
    topic: 'Long-Term Growth',
    summary: 'Understand why starting early at age 20 beats saving twice as much at age 30.',
    takeaways: [
      'Compound growth earns returns on both your principal and prior returns.',
      'Time in years is the strongest multiplier—starting at 20 gives a 10-year edge.',
      'Consistency beats large one-time deposits.',
    ],
    body: [
      'Compound interest is simply growth on top of growth. When ₹1,000 earns 10% in year one, it becomes ₹1,100. In year two, 10% is calculated on ₹1,100—not just your original ₹1,000.',
      'Over 15 to 25 years, that snowball curve accelerates dramatically. Building the discipline to save even 10–15% of your income during college creates the habit that powers lifelong financial independence.',
    ],
  },
];

export function formatCurrency(amount: number, currency: CurrencyCode = 'INR'): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
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
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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
  return Math.max(1, totalDays - new Date().getDate() + 1);
}

export function getCategoryInfo(category: TxCategory): { label: string; color: string; pastelBg: string } {
  const exp = EXPENSE_CATEGORIES.find((c) => c.id === category);
  if (exp) return { label: exp.label, color: exp.color, pastelBg: exp.pastelBg };
  const inc = INCOME_CATEGORIES.find((c) => c.id === category);
  if (inc) return { label: inc.label, color: inc.color, pastelBg: '#E8F7F2' };
  if (category === 'wallet_transfer') {
    return { label: 'Wallet Transfer', color: '#4778E8', pastelBg: '#EDF2FD' };
  }
  return { label: 'Other', color: '#64748B', pastelBg: '#F1F5F9' };
}

export function computeWalletBalances(
  wallets: Wallet[],
  transactions: Transaction[]
): Map<string, { balance: number; txCount: number }> {
  const map = new Map<string, { balance: number; txCount: number }>();
  for (const w of wallets) {
    map.set(w.id, { balance: w.openingBalance, txCount: 0 });
  }
  for (const tx of transactions) {
    const src = map.get(tx.walletId);
    if (tx.type === 'expense') {
      if (src) {
        src.balance -= tx.amount;
        src.txCount += 1;
      }
    } else if (tx.type === 'income') {
      if (src) {
        src.balance += tx.amount;
        src.txCount += 1;
      }
    } else if (tx.type === 'transfer') {
      if (src) {
        src.balance -= tx.amount;
        src.txCount += 1;
      }
      if (tx.toWalletId) {
        const dest = map.get(tx.toWalletId);
        if (dest) {
          dest.balance += tx.amount;
          dest.txCount += 1;
        }
      }
    }
  }
  return map;
}
