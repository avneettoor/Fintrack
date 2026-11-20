import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  CATEGORIES,
  DATE_REGEX,
  ExpenseCategory,
  GoalCategory,
  ID_REGEX,
  MAX_ALLOWANCE_AMOUNT,
  MAX_CAMPUS_NAME_LENGTH,
  MAX_CHALLENGE_DAYS,
  MAX_CHALLENGE_TITLE_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  MAX_EXPENSE_AMOUNT,
  MAX_GOAL_AMOUNT,
  MAX_GOAL_TITLE_LENGTH,
  MAX_NOTE_LENGTH,
  MONTH_KEY_REGEX,
  PaymentMethod,
  PlanTier,
  RecordStatus,
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

export async function ensureUserProfile(user: User): Promise<void> {
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
    user.displayName || user.email?.split('@')[0] || 'Campus Student',
    MAX_DISPLAY_NAME_LENGTH,
    'Campus Student'
  );

  const email = (user.email || '').trim().slice(0, 160);
  const photoURL = user.photoURL && user.photoURL.length <= 500 ? user.photoURL : undefined;

  const payload: Record<string, unknown> = {
    uid: user.uid,
    displayName,
    email,
    campusName: 'DBS Global University, Dehradun',
    monthlyAllowance: 8000,
    planTier: 'free' as PlanTier,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (photoURL) {
    payload.photoURL = photoURL;
  }

  try {
    await setDoc(userRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, userPath);
  }
}

export async function updateUserProfile(
  uid: string,
  updates: {
    displayName: string;
    campusName: string;
    monthlyAllowance: number;
    photoURL?: string;
  }
): Promise<void> {
  const userPath = `users/${uid}`;
  const payload: Record<string, unknown> = {
    displayName: clampString(updates.displayName, MAX_DISPLAY_NAME_LENGTH, 'Campus Student'),
    campusName: clampString(updates.campusName, MAX_CAMPUS_NAME_LENGTH, 'Campus University'),
    monthlyAllowance: clampNumber(updates.monthlyAllowance, 0, MAX_ALLOWANCE_AMOUNT),
    updatedAt: serverTimestamp(),
  };

  if (updates.photoURL && updates.photoURL.length <= 500) {
    payload.photoURL = updates.photoURL;
  }

  try {
    await updateDoc(doc(db, 'users', uid), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function updatePlanTier(uid: string, planTier: PlanTier): Promise<void> {
  const userPath = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      planTier,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function addExpense(
  uid: string,
  input: {
    amount: number;
    category: ExpenseCategory;
    paymentMethod: PaymentMethod;
    note: string;
    date: string;
  }
): Promise<void> {
  const colPath = `users/${uid}/expenses`;
  const safeDate = DATE_REGEX.test(input.date) ? input.date : new Date().toISOString().slice(0, 10);
  const monthKey = safeDate.slice(0, 7);

  const payload = {
    userId: uid,
    amount: clampNumber(input.amount, 1, MAX_EXPENSE_AMOUNT),
    category: input.category,
    paymentMethod: input.paymentMethod,
    note: clampString(input.note, MAX_NOTE_LENGTH, 'Daily expense'),
    date: safeDate,
    monthKey: MONTH_KEY_REGEX.test(monthKey) ? monthKey : new Date().toISOString().slice(0, 7),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await addDoc(collection(db, 'users', uid, 'expenses'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colPath);
  }
}

export async function updateExpense(
  uid: string,
  expenseId: string,
  input: {
    amount: number;
    category: ExpenseCategory;
    paymentMethod: PaymentMethod;
    note: string;
    date: string;
  }
): Promise<void> {
  const docPath = `users/${uid}/expenses/${expenseId}`;
  const safeDate = DATE_REGEX.test(input.date) ? input.date : new Date().toISOString().slice(0, 10);
  const monthKey = safeDate.slice(0, 7);

  try {
    await updateDoc(doc(db, 'users', uid, 'expenses', expenseId), {
      amount: clampNumber(input.amount, 1, MAX_EXPENSE_AMOUNT),
      category: input.category,
      paymentMethod: input.paymentMethod,
      note: clampString(input.note, MAX_NOTE_LENGTH, 'Daily expense'),
      date: safeDate,
      monthKey,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteExpense(uid: string, expenseId: string): Promise<void> {
  const docPath = `users/${uid}/expenses/${expenseId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'expenses', expenseId));
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
  const safeMonth = MONTH_KEY_REGEX.test(monthKey)
    ? monthKey
    : new Date().toISOString().slice(0, 7);
  const budgetId = `${safeMonth}_${category}`;
  const docPath = `users/${uid}/budgets/${budgetId}`;
  const budgetRef = doc(db, 'users', uid, 'budgets', budgetId);
  const clampedLimit = clampNumber(limitAmount, 0, MAX_ALLOWANCE_AMOUNT);

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

export async function createSavingsGoal(
  uid: string,
  input: {
    title: string;
    targetAmount: number;
    savedAmount: number;
    targetDate: string;
    category: GoalCategory;
  }
): Promise<void> {
  const colPath = `users/${uid}/goals`;
  const targetAmount = clampNumber(input.targetAmount, 1, MAX_GOAL_AMOUNT);
  const savedAmount = clampNumber(input.savedAmount, 0, targetAmount);
  const status: RecordStatus = savedAmount >= targetAmount ? 'completed' : 'active';
  const safeDate = DATE_REGEX.test(input.targetDate)
    ? input.targetDate
    : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  try {
    await addDoc(collection(db, 'users', uid, 'goals'), {
      userId: uid,
      title: clampString(input.title, MAX_GOAL_TITLE_LENGTH, 'Savings Goal'),
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

export async function depositToGoal(
  uid: string,
  goalId: string,
  currentSaved: number,
  targetAmount: number,
  depositAmount: number
): Promise<void> {
  const docPath = `users/${uid}/goals/${goalId}`;
  const nextSaved = clampNumber(currentSaved + depositAmount, 0, MAX_GOAL_AMOUNT);
  const nextStatus: RecordStatus = nextSaved >= targetAmount ? 'completed' : 'active';

  try {
    await updateDoc(doc(db, 'users', uid, 'goals', goalId), {
      savedAmount: nextSaved,
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteSavingsGoal(uid: string, goalId: string): Promise<void> {
  const docPath = `users/${uid}/goals/${goalId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'goals', goalId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function startHabitChallenge(
  uid: string,
  template: {
    templateId: string;
    title: string;
    targetDays: number;
  }
): Promise<void> {
  const colPath = `users/${uid}/challenges`;
  const safeTemplateId = ID_REGEX.test(template.templateId)
    ? template.templateId.slice(0, 40)
    : 'custom_challenge';

  try {
    await addDoc(collection(db, 'users', uid, 'challenges'), {
      userId: uid,
      templateId: safeTemplateId,
      title: clampString(template.title, MAX_CHALLENGE_TITLE_LENGTH, 'Habit Challenge'),
      targetDays: clampNumber(template.targetDays, 1, MAX_CHALLENGE_DAYS),
      completedDays: [],
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
): Promise<void> {
  const docPath = `users/${uid}/challenges/${challengeId}`;
  if (!DATE_REGEX.test(dateISO)) return;

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
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteHabitChallenge(uid: string, challengeId: string): Promise<void> {
  const docPath = `users/${uid}/challenges/${challengeId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'challenges', challengeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function seedSampleCampusMonth(uid: string, monthKey: string): Promise<void> {
  const safeMonth = MONTH_KEY_REGEX.test(monthKey)
    ? monthKey
    : new Date().toISOString().slice(0, 7);
  const batch = writeBatch(db);

  const day = (d: number) => `${safeMonth}-${String(d).padStart(2, '0')}`;

  const sampleExpenses: {
    amount: number;
    category: ExpenseCategory;
    paymentMethod: PaymentMethod;
    note: string;
    date: string;
  }[] = [
    { amount: 65, category: 'food', paymentMethod: 'upi', note: 'Campus Maggi Point & chai', date: day(2) },
    { amount: 140, category: 'transport', paymentMethod: 'upi', note: 'Vikram auto to Rajpur Road', date: day(3) },
    { amount: 280, category: 'campus', paymentMethod: 'cash', note: 'MBA Finance spiral printouts', date: day(5) },
    { amount: 199, category: 'subscriptions', paymentMethod: 'upi', note: 'Student mobile data pack', date: day(6) },
    { amount: 420, category: 'entertainment', paymentMethod: 'upi', note: 'Pacific Mall movie with hostel group', date: day(8) },
    { amount: 110, category: 'food', paymentMethod: 'upi', note: 'Evening momos & cold coffee', date: day(10) },
    { amount: 350, category: 'shopping', paymentMethod: 'card', note: 'Hostel room toiletries & detergent', date: day(12) },
    { amount: 260, category: 'hostel', paymentMethod: 'cash', note: 'Monthly laundry bundle', date: day(14) },
    { amount: 185, category: 'food', paymentMethod: 'upi', note: 'Canteen lunch thali & lassi', date: day(16) },
    { amount: 90, category: 'transport', paymentMethod: 'cash', note: 'Shared auto back to DGU campus', date: day(18) },
  ];

  for (const item of sampleExpenses) {
    const ref = doc(collection(db, 'users', uid, 'expenses'));
    batch.set(ref, {
      userId: uid,
      amount: item.amount,
      category: item.category,
      paymentMethod: item.paymentMethod,
      note: item.note,
      date: item.date,
      monthKey: safeMonth,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  for (const cat of CATEGORIES) {
    const budgetRef = doc(db, 'users', uid, 'budgets', `${safeMonth}_${cat.id}`);
    batch.set(budgetRef, {
      userId: uid,
      monthKey: safeMonth,
      category: cat.id,
      limitAmount: cat.defaultCap,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const goal1Ref = doc(collection(db, 'users', uid, 'goals'));
  batch.set(goal1Ref, {
    userId: uid,
    title: 'Rishikesh Weekend Trip',
    targetAmount: 2500,
    savedAmount: 1100,
    targetDate: day(28),
    category: 'travel',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const goal2Ref = doc(collection(db, 'users', uid, 'goals'));
  batch.set(goal2Ref, {
    userId: uid,
    title: 'Emergency Hostel Cushion',
    targetAmount: 3000,
    savedAmount: 900,
    targetDate: day(28),
    category: 'emergency',
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const chRef = doc(collection(db, 'users', uid, 'challenges'));
  batch.set(chRef, {
    userId: uid,
    templateId: 'no_delivery_7d',
    title: '7-Day No Food Delivery',
    targetDays: 7,
    completedDays: [day(1), day(2), day(3)],
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/batchSeed`);
  }
}
