import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  AgeGroup,
  CurrencyCode,
  DATE_REGEX,
  ExpenseCategory,
  getCurrentMonthKey,
  getTodayISO,
  GoalCategory,
  ID_REGEX,
  MAX_AMOUNT,
  MAX_CAMPUS_NAME_LENGTH,
  MAX_CHALLENGE_DAYS,
  MAX_CHALLENGE_TITLE_LENGTH,
  MAX_DESC_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_GOAL_NAME_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_WALLET_NAME_LENGTH,
  MONTH_KEY_REGEX,
  NotificationKind,
  NotificationPrefs,
  PaymentMethod,
  PlanTier,
  RecordStatus,
  shiftMonthKey,
  ThemeMode,
  TransactionType,
  TxCategory,
  WalletType,
} from '../types/finance';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreError';

function clampString(value: string, maxLength: number, fallback: string): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback.slice(0, maxLength);
  return trimmed.slice(0, maxLength);
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value * 100) / 100));
}

export async function ensureUserProfile(
  user: User,
  overrides?: {
    displayName?: string;
    campusName?: string;
    ageGroup?: AgeGroup;
    onboardingCompleted?: boolean;
  }
): Promise<void> {
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);

  let snap;
  try {
    snap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  if (snap.exists()) {
    return;
  }

  const displayName = clampString(
    overrides?.displayName || user.displayName || user.email?.split('@')[0] || 'Campus Student',
    MAX_DISPLAY_NAME_LENGTH,
    'Campus Student'
  );
  const email = (user.email || '').trim().slice(0, 160);
  const photoURL = user.photoURL && user.photoURL.length <= 500 ? user.photoURL : undefined;

  const batch = writeBatch(db);
  const profilePayload: Record<string, unknown> = {
    uid: user.uid,
    displayName,
    email,
    campusName: clampString(
      overrides?.campusName || 'DBS Global University, Dehradun',
      MAX_CAMPUS_NAME_LENGTH,
      'DBS Global University, Dehradun'
    ),
    ageGroup: overrides?.ageGroup || ('18-20' as AgeGroup),
    currency: 'INR' as CurrencyCode,
    monthlyAllowance: 20000,
    monthlyBudget: 15000,
    savingsTarget: 5000,
    onboardingCompleted: overrides?.onboardingCompleted ?? false,
    planTier: 'free' as PlanTier,
    theme: 'light' as ThemeMode,
    readArticleIds: [],
    notificationPrefs: {
      budgetAlerts: true,
      inactivityReminders: true,
      goalMilestones: true,
      challengeAlerts: true,
    } as NotificationPrefs,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (photoURL) {
    profilePayload.photoURL = photoURL;
  }

  batch.set(userRef, profilePayload);

  // Create default starter wallets for the student
  const defaultWallets: { id: string; name: string; type: WalletType; color: string }[] = [
    { id: 'wallet_upi', name: 'UPI Wallet', type: 'upi', color: '#18A879' },
    { id: 'wallet_cash', name: 'Cash Wallet', type: 'cash', color: '#F4B544' },
    { id: 'wallet_savings', name: 'Savings Wallet', type: 'savings', color: '#4778E8' },
  ];

  for (const w of defaultWallets) {
    batch.set(doc(db, 'users', user.uid, 'wallets', w.id), {
      userId: user.uid,
      name: w.name,
      type: w.type,
      openingBalance: 0,
      color: w.color,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, userPath);
  }
}

export async function completeOnboarding(
  uid: string,
  input: {
    campusName: string;
    ageGroup: AgeGroup;
    currency: CurrencyCode;
    monthlyAllowance: number;
    monthlyBudget: number;
    savingsTarget: number;
  }
): Promise<void> {
  const userPath = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      campusName: clampString(input.campusName, MAX_CAMPUS_NAME_LENGTH, 'Campus University'),
      ageGroup: input.ageGroup,
      currency: input.currency,
      monthlyAllowance: clampNumber(input.monthlyAllowance, 0, MAX_AMOUNT),
      monthlyBudget: clampNumber(input.monthlyBudget, 0, MAX_AMOUNT),
      savingsTarget: clampNumber(input.savingsTarget, 0, MAX_AMOUNT),
      onboardingCompleted: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function updateUserProfile(
  uid: string,
  input: {
    displayName: string;
    campusName: string;
    ageGroup: AgeGroup;
    currency: CurrencyCode;
    monthlyAllowance: number;
    monthlyBudget: number;
    savingsTarget: number;
    photoURL?: string;
  }
): Promise<void> {
  const userPath = `users/${uid}`;
  const payload: Record<string, unknown> = {
    displayName: clampString(input.displayName, MAX_DISPLAY_NAME_LENGTH, 'Campus Student'),
    campusName: clampString(input.campusName, MAX_CAMPUS_NAME_LENGTH, 'Campus University'),
    ageGroup: input.ageGroup,
    currency: input.currency,
    monthlyAllowance: clampNumber(input.monthlyAllowance, 0, MAX_AMOUNT),
    monthlyBudget: clampNumber(input.monthlyBudget, 0, MAX_AMOUNT),
    savingsTarget: clampNumber(input.savingsTarget, 0, MAX_AMOUNT),
    updatedAt: serverTimestamp(),
  };

  if (input.photoURL && input.photoURL.length <= 500) {
    payload.photoURL = input.photoURL;
  }

  try {
    await updateDoc(doc(db, 'users', uid), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function updateThemeMode(uid: string, theme: ThemeMode): Promise<void> {
  const userPath = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      theme,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function updateNotificationPrefs(
  uid: string,
  notificationPrefs: NotificationPrefs
): Promise<void> {
  const userPath = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      notificationPrefs,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function toggleArticleRead(
  uid: string,
  currentIds: string[],
  articleId: string
): Promise<void> {
  const userPath = `users/${uid}`;
  const nextIds = currentIds.includes(articleId)
    ? currentIds.filter((id) => id !== articleId)
    : [...currentIds, articleId].slice(0, 30);

  try {
    await updateDoc(doc(db, 'users', uid), {
      readArticleIds: nextIds,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function selectSubscriptionPlan(
  uid: string,
  plan: PlanTier,
  billingCycle: 'none' | 'monthly' | 'annual',
  priceInr: number
): Promise<void> {
  const userPath = `users/${uid}`;
  const subPath = `users/${uid}/subscriptions/current`;
  const batch = writeBatch(db);

  batch.update(doc(db, 'users', uid), {
    planTier: plan,
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(db, 'users', uid, 'subscriptions', 'current'), {
    userId: uid,
    plan,
    priceInr: clampNumber(priceInr, 0, 10000),
    billingCycle,
    status: plan === 'free' ? 'active' : 'preview_interest',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${userPath} & ${subPath}`);
  }
}

export async function addTransaction(
  uid: string,
  input: {
    type: TransactionType;
    amount: number;
    description: string;
    category: TxCategory;
    date: string;
    paymentMethod: PaymentMethod;
    walletId: string;
    toWalletId?: string;
    notes?: string;
    tags?: string[];
    receiptName?: string;
    receiptDataUrl?: string;
  }
): Promise<void> {
  const colPath = `users/${uid}/transactions`;
  const safeDate = DATE_REGEX.test(input.date) ? input.date : getTodayISO();
  const monthKey = safeDate.slice(0, 7);
  const safeTags = (input.tags || [])
    .map((t) => t.trim().slice(0, 30))
    .filter(Boolean)
    .slice(0, 8);

  const payload: Record<string, unknown> = {
    userId: uid,
    type: input.type,
    amount: clampNumber(input.amount, 1, MAX_AMOUNT),
    description: clampString(input.description, MAX_DESC_LENGTH, 'Transaction'),
    category: input.type === 'transfer' ? 'wallet_transfer' : input.category,
    date: safeDate,
    monthKey: MONTH_KEY_REGEX.test(monthKey) ? monthKey : getCurrentMonthKey(),
    paymentMethod: input.paymentMethod,
    walletId: ID_REGEX.test(input.walletId) ? input.walletId : 'wallet_upi',
    tags: safeTags,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (input.type === 'transfer' && input.toWalletId && ID_REGEX.test(input.toWalletId)) {
    payload.toWalletId = input.toWalletId;
  }
  if (input.notes && input.notes.trim()) {
    payload.notes = input.notes.trim().slice(0, MAX_NOTES_LENGTH);
  }
  if (input.receiptName && input.receiptName.trim()) {
    payload.receiptName = input.receiptName.trim().slice(0, 140);
  }
  if (input.receiptDataUrl && input.receiptDataUrl.length <= 200000) {
    payload.receiptDataUrl = input.receiptDataUrl;
  }

  try {
    await addDoc(collection(db, 'users', uid, 'transactions'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}

export async function updateTransaction(
  uid: string,
  txId: string,
  input: {
    type: TransactionType;
    amount: number;
    description: string;
    category: TxCategory;
    date: string;
    paymentMethod: PaymentMethod;
    walletId: string;
    toWalletId?: string;
    notes?: string;
    tags?: string[];
    receiptName?: string;
    receiptDataUrl?: string;
  }
): Promise<void> {
  const docPath = `users/${uid}/transactions/${txId}`;
  const safeDate = DATE_REGEX.test(input.date) ? input.date : getTodayISO();
  const monthKey = safeDate.slice(0, 7);
  const safeTags = (input.tags || [])
    .map((t) => t.trim().slice(0, 30))
    .filter(Boolean)
    .slice(0, 8);

  const payload: Record<string, unknown> = {
    type: input.type,
    amount: clampNumber(input.amount, 1, MAX_AMOUNT),
    description: clampString(input.description, MAX_DESC_LENGTH, 'Transaction'),
    category: input.type === 'transfer' ? 'wallet_transfer' : input.category,
    date: safeDate,
    monthKey,
    paymentMethod: input.paymentMethod,
    walletId: ID_REGEX.test(input.walletId) ? input.walletId : 'wallet_upi',
    tags: safeTags,
    updatedAt: serverTimestamp(),
  };

  if (input.type === 'transfer' && input.toWalletId && ID_REGEX.test(input.toWalletId)) {
    payload.toWalletId = input.toWalletId;
  }
  if (input.notes && input.notes.trim()) {
    payload.notes = input.notes.trim().slice(0, MAX_NOTES_LENGTH);
  }
  if (input.receiptName && input.receiptName.trim()) {
    payload.receiptName = input.receiptName.trim().slice(0, 140);
  }
  if (input.receiptDataUrl && input.receiptDataUrl.length <= 200000) {
    payload.receiptDataUrl = input.receiptDataUrl;
  }

  try {
    await updateDoc(doc(db, 'users', uid, 'transactions', txId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteTransaction(uid: string, txId: string): Promise<void> {
  const docPath = `users/${uid}/transactions/${txId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'transactions', txId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function createWallet(
  uid: string,
  input: {
    name: string;
    type: WalletType;
    openingBalance: number;
    color: string;
  }
): Promise<void> {
  const colPath = `users/${uid}/wallets`;
  try {
    await addDoc(collection(db, 'users', uid, 'wallets'), {
      userId: uid,
      name: clampString(input.name, MAX_WALLET_NAME_LENGTH, 'Wallet'),
      type: input.type,
      openingBalance: clampNumber(input.openingBalance, -MAX_AMOUNT, MAX_AMOUNT),
      color: input.color.slice(0, 24) || '#18A879',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}

export async function updateWallet(
  uid: string,
  walletId: string,
  input: {
    name: string;
    type: WalletType;
    openingBalance: number;
    color: string;
  }
): Promise<void> {
  const docPath = `users/${uid}/wallets/${walletId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'wallets', walletId), {
      name: clampString(input.name, MAX_WALLET_NAME_LENGTH, 'Wallet'),
      type: input.type,
      openingBalance: clampNumber(input.openingBalance, -MAX_AMOUNT, MAX_AMOUNT),
      color: input.color.slice(0, 24) || '#18A879',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteWallet(uid: string, walletId: string): Promise<void> {
  const docPath = `users/${uid}/wallets/${walletId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'wallets', walletId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function upsertCategoryBudget(
  uid: string,
  monthKey: string,
  category: ExpenseCategory,
  limitAmount: number
): Promise<void> {
  const safeMonth = MONTH_KEY_REGEX.test(monthKey) ? monthKey : getCurrentMonthKey();
  const budgetId = `${safeMonth}_${category}`;
  const docPath = `users/${uid}/budgets/${budgetId}`;
  const budgetRef = doc(db, 'users', uid, 'budgets', budgetId);
  const clampedLimit = clampNumber(limitAmount, 0, MAX_AMOUNT);

  let existingSnap;
  try {
    existingSnap = await getDoc(budgetRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }

  if (existingSnap.exists()) {
    try {
      await updateDoc(budgetRef, {
        limitAmount: clampedLimit,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    }
  } else {
    try {
      await setDoc(budgetRef, {
        userId: uid,
        monthKey: safeMonth,
        category,
        limitAmount: clampedLimit,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
  }
}

export async function deleteCategoryBudget(uid: string, budgetId: string): Promise<void> {
  const docPath = `users/${uid}/budgets/${budgetId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'budgets', budgetId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function createSavingsGoal(
  uid: string,
  input: {
    name: string;
    targetAmount: number;
    savedAmount: number;
    targetDate: string;
    category: GoalCategory;
  }
): Promise<void> {
  const colPath = `users/${uid}/savingsGoals`;
  const targetAmount = clampNumber(input.targetAmount, 1, MAX_AMOUNT);
  const savedAmount = clampNumber(input.savedAmount, 0, targetAmount);
  const status: RecordStatus = savedAmount >= targetAmount ? 'completed' : 'active';
  const safeDate = DATE_REGEX.test(input.targetDate)
    ? input.targetDate
    : new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);

  try {
    await addDoc(collection(db, 'users', uid, 'savingsGoals'), {
      userId: uid,
      name: clampString(input.name, MAX_GOAL_NAME_LENGTH, 'Savings Goal'),
      targetAmount,
      savedAmount,
      targetDate: safeDate,
      category: input.category,
      status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}

export async function updateSavingsGoalDetails(
  uid: string,
  goalId: string,
  input: {
    name: string;
    targetAmount: number;
    targetDate: string;
    category: GoalCategory;
    currentSaved: number;
  }
): Promise<void> {
  const docPath = `users/${uid}/savingsGoals/${goalId}`;
  const targetAmount = clampNumber(input.targetAmount, 1, MAX_AMOUNT);
  const status: RecordStatus = input.currentSaved >= targetAmount ? 'completed' : 'active';

  try {
    await updateDoc(doc(db, 'users', uid, 'savingsGoals', goalId), {
      name: clampString(input.name, MAX_GOAL_NAME_LENGTH, 'Savings Goal'),
      targetAmount,
      targetDate: DATE_REGEX.test(input.targetDate) ? input.targetDate : getTodayISO(),
      category: input.category,
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function adjustGoalBalance(
  uid: string,
  goalId: string,
  currentSaved: number,
  targetAmount: number,
  deltaAmount: number
): Promise<void> {
  const docPath = `users/${uid}/savingsGoals/${goalId}`;
  const nextSaved = clampNumber(currentSaved + deltaAmount, 0, MAX_AMOUNT);
  const nextStatus: RecordStatus = nextSaved >= targetAmount ? 'completed' : 'active';

  try {
    await updateDoc(doc(db, 'users', uid, 'savingsGoals', goalId), {
      savedAmount: nextSaved,
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteSavingsGoal(uid: string, goalId: string): Promise<void> {
  const docPath = `users/${uid}/savingsGoals/${goalId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'savingsGoals', goalId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function startChallenge(
  uid: string,
  template: {
    templateId: string;
    title: string;
    description: string;
    targetDays: number;
    pointsReward: number;
  }
): Promise<void> {
  const colPath = `users/${uid}/challenges`;
  const start = getTodayISO();
  const endObj = new Date();
  endObj.setDate(endObj.getDate() + template.targetDays);
  const end = endObj.toISOString().slice(0, 10);

  try {
    await addDoc(collection(db, 'users', uid, 'challenges'), {
      userId: uid,
      templateId: ID_REGEX.test(template.templateId)
        ? template.templateId.slice(0, 40)
        : 'custom_challenge',
      title: clampString(template.title, MAX_CHALLENGE_TITLE_LENGTH, 'Money Challenge'),
      description: clampString(template.description, 200, 'Complete your daily discipline goal.'),
      targetDays: clampNumber(template.targetDays, 1, MAX_CHALLENGE_DAYS),
      startDate: start,
      endDate: end,
      completedDays: [],
      pointsReward: clampNumber(template.pointsReward, 0, 1000),
      status: 'active' as RecordStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}

export async function toggleChallengeCheckIn(
  uid: string,
  challengeId: string,
  currentDays: string[],
  targetDays: number,
  dateISO: string
): Promise<boolean> {
  const docPath = `users/${uid}/challenges/${challengeId}`;
  if (!DATE_REGEX.test(dateISO)) return false;

  const exists = currentDays.includes(dateISO);
  const nextDays = exists
    ? currentDays.filter((d) => d !== dateISO)
    : [...currentDays, dateISO].slice(0, MAX_CHALLENGE_DAYS);
  const nextStatus: RecordStatus = nextDays.length >= targetDays ? 'completed' : 'active';

  try {
    await updateDoc(doc(db, 'users', uid, 'challenges', challengeId), {
      completedDays: nextDays,
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
    return nextStatus === 'completed';
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteChallenge(uid: string, challengeId: string): Promise<void> {
  const docPath = `users/${uid}/challenges/${challengeId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'challenges', challengeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function createNotificationIfNew(
  uid: string,
  input: {
    dedupeKey: string;
    title: string;
    message: string;
    kind: NotificationKind;
  }
): Promise<void> {
  const safeId = input.dedupeKey.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 80);
  const docPath = `users/${uid}/notifications/${safeId}`;
  const notifRef = doc(db, 'users', uid, 'notifications', safeId);

  try {
    const snap = await getDoc(notifRef);
    if (snap.exists()) return;
    await setDoc(notifRef, {
      userId: uid,
      title: clampString(input.title, 100, 'Notification'),
      message: clampString(input.message, 240, ''),
      kind: input.kind,
      dedupeKey: safeId,
      read: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function markNotificationRead(uid: string, notificationId: string): Promise<void> {
  const docPath = `users/${uid}/notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'notifications', notificationId), {
      read: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteNotification(uid: string, notificationId: string): Promise<void> {
  const docPath = `users/${uid}/notifications/${notificationId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'notifications', notificationId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function deleteAllUserAccountData(uid: string): Promise<void> {
  const subcols = [
    'transactions',
    'wallets',
    'budgets',
    'savingsGoals',
    'challenges',
    'notifications',
    'subscriptions',
  ];

  const batch = writeBatch(db);
  for (const sub of subcols) {
    const snap = await getDocs(collection(db, 'users', uid, sub));
    snap.docs.forEach((d) => batch.delete(d.ref));
  }
  batch.delete(doc(db, 'users', uid));

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
  }
}

/**
 * Populates optional demonstration student data matching the exact prompt specification:
 * Monthly Allowance/Income: ₹20,000
 * Expenses: Food ₹2,500, Transportation ₹1,200, Shopping ₹1,500, Entertainment ₹800,
 * Education ₹1,000, Other ₹500 -> Total Expenses: ₹7,500
 * Remaining / Total Balance: ₹12,500
 * Monthly Budget: ₹15,000 (50% used)
 * Goal: Buy a Laptop (Target ₹60,000, Saved ₹18,000, 30%)
 */
export async function seedDemoCampusData(uid: string, monthKey: string): Promise<void> {
  const safeMonth = MONTH_KEY_REGEX.test(monthKey) ? monthKey : getCurrentMonthKey();
  const prevMonth = shiftMonthKey(safeMonth, -1);
  const day = (m: string, d: number) => `${m}-${String(d).padStart(2, '0')}`;

  const batch = writeBatch(db);

  // Ensure monthly allowance = 20000, monthlyBudget = 15000, onboardingCompleted = true
  batch.update(doc(db, 'users', uid), {
    monthlyAllowance: 20000,
    monthlyBudget: 15000,
    savingsTarget: 5000,
    onboardingCompleted: true,
    updatedAt: serverTimestamp(),
  });

  // Wallets (openingBalance 0 so balances are 100% derived from transactions!)
  const walletList: { id: string; name: string; type: WalletType; color: string }[] = [
    { id: 'wallet_upi', name: 'UPI Wallet', type: 'upi', color: '#18A879' },
    { id: 'wallet_cash', name: 'Cash Wallet', type: 'cash', color: '#F4B544' },
    { id: 'wallet_bank', name: 'Bank Account', type: 'bank', color: '#172B4D' },
    { id: 'wallet_savings', name: 'Savings Wallet', type: 'savings', color: '#4778E8' },
  ];
  for (const w of walletList) {
    batch.set(doc(db, 'users', uid, 'wallets', w.id), {
      userId: uid,
      name: w.name,
      type: w.type,
      openingBalance: 0,
      color: w.color,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // Exact current-month demonstration transactions totaling ₹20,000 Income and ₹7,500 Expenses
  const demoTxs: {
    type: TransactionType;
    amount: number;
    description: string;
    category: TxCategory;
    date: string;
    paymentMethod: PaymentMethod;
    walletId: string;
    toWalletId?: string;
    tags: string[];
  }[] = [
    {
      type: 'income',
      amount: 20000,
      description: 'Monthly Family Allowance',
      category: 'allowance_income',
      date: day(safeMonth, 1),
      paymentMethod: 'bank_transfer',
      walletId: 'wallet_bank',
      tags: ['allowance'],
    },
    {
      type: 'transfer',
      amount: 9000,
      description: 'Move spending money to UPI Wallet',
      category: 'wallet_transfer',
      date: day(safeMonth, 1),
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
      date: day(safeMonth, 2),
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
      date: day(safeMonth, 2),
      paymentMethod: 'cash',
      walletId: 'wallet_bank',
      toWalletId: 'wallet_cash',
      tags: ['atm'],
    },
    // Food & Dining = ₹2,500
    {
      type: 'expense',
      amount: 1450,
      description: 'Campus mess & canteen meals',
      category: 'food_dining',
      date: day(safeMonth, 4),
      paymentMethod: 'upi',
      walletId: 'wallet_upi',
      tags: ['canteen'],
    },
    {
      type: 'expense',
      amount: 1050,
      description: 'Maggi point, chai & cafe with friends',
      category: 'food_dining',
      date: day(safeMonth, 11),
      paymentMethod: 'upi',
      walletId: 'wallet_upi',
      tags: ['chai', 'snacks'],
    },
    // Transportation = ₹1,200
    {
      type: 'expense',
      amount: 750,
      description: 'Dehradun city bus & Vikram auto pass',
      category: 'transportation',
      date: day(safeMonth, 5),
      paymentMethod: 'cash',
      walletId: 'wallet_cash',
      tags: ['commute'],
    },
    {
      type: 'expense',
      amount: 450,
      description: 'Shared cab to ISBT & Clock Tower',
      category: 'transportation',
      date: day(safeMonth, 13),
      paymentMethod: 'upi',
      walletId: 'wallet_upi',
      tags: ['travel'],
    },
    // Shopping = ₹1,500
    {
      type: 'expense',
      amount: 1500,
      description: 'Winter hoodie & hostel essentials',
      category: 'shopping',
      date: day(safeMonth, 8),
      paymentMethod: 'debit_card',
      walletId: 'wallet_bank',
      tags: ['apparel'],
    },
    // Entertainment = ₹800
    {
      type: 'expense',
      amount: 800,
      description: 'Pacific Mall cinema & snacks',
      category: 'entertainment',
      date: day(safeMonth, 14),
      paymentMethod: 'upi',
      walletId: 'wallet_upi',
      tags: ['weekend'],
    },
    // Education = ₹1,000
    {
      type: 'expense',
      amount: 1000,
      description: 'Finance textbooks & spiral printouts',
      category: 'education',
      date: day(safeMonth, 6),
      paymentMethod: 'upi',
      walletId: 'wallet_upi',
      tags: ['books'],
    },
    // Other = ₹500
    {
      type: 'expense',
      amount: 500,
      description: 'Hostel laundry & club contribution',
      category: 'other',
      date: day(safeMonth, 16),
      paymentMethod: 'cash',
      walletId: 'wallet_cash',
      tags: ['hostel'],
    },
    // Previous month comparison entries (in prevMonth)
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

  for (const tx of demoTxs) {
    const ref = doc(collection(db, 'users', uid, 'transactions'));
    const payload: Record<string, unknown> = {
      userId: uid,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      category: tx.category,
      date: tx.date,
      monthKey: tx.date.slice(0, 7),
      paymentMethod: tx.paymentMethod,
      walletId: tx.walletId,
      tags: tx.tags,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (tx.toWalletId) payload.toWalletId = tx.toWalletId;
    batch.set(ref, payload);
  }

  // Category Budgets totaling ₹15,000 matching prompt Section 7 example
  const demoBudgets: { category: ExpenseCategory; limit: number }[] = [
    { category: 'food_dining', limit: 4000 },
    { category: 'transportation', limit: 2000 },
    { category: 'shopping', limit: 2000 },
    { category: 'education', limit: 3000 },
    { category: 'entertainment', limit: 1000 },
    { category: 'other', limit: 3000 },
  ];

  for (const b of demoBudgets) {
    batch.set(doc(db, 'users', uid, 'budgets', `${safeMonth}_${b.category}`), {
      userId: uid,
      monthKey: safeMonth,
      category: b.category,
      limitAmount: b.limit,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // Savings Goals matching prompt Section 9 example
  batch.set(doc(collection(db, 'users', uid, 'savingsGoals')), {
    userId: uid,
    name: 'Buy a Laptop',
    targetAmount: 60000,
    savedAmount: 18000,
    targetDate: day(shiftMonthKey(safeMonth, 6), 15),
    category: 'laptop',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(doc(collection(db, 'users', uid, 'savingsGoals')), {
    userId: uid,
    name: 'Emergency Fund',
    targetAmount: 10000,
    savedAmount: 4500,
    targetDate: day(shiftMonthKey(safeMonth, 3), 25),
    category: 'emergency',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Challenge
  batch.set(doc(collection(db, 'users', uid, 'challenges')), {
    userId: uid,
    templateId: 'save_50_daily_7d',
    title: 'Save ₹50 Every Day',
    description: 'Skip one impulse chai/snack purchase and stash ₹50 daily for a week.',
    targetDays: 7,
    startDate: day(safeMonth, 1),
    endDate: day(safeMonth, 8),
    completedDays: [day(safeMonth, 1), day(safeMonth, 2), day(safeMonth, 3)],
    pointsReward: 120,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/demoSeed`);
  }
}
