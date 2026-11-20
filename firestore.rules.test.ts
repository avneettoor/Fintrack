/**
 * Phase 0 Security TDD Specification for FinTrack Campus Firestore Rules.
 * Verifies the "Dirty Dozen" payloads against the rules contract.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Unverified email spoof on user profile creation',
    operation: 'create',
    path: '/users/userA',
    auth: { uid: 'userA', email_verified: false },
    payload: { uid: 'userA', email: 'a@dgu.ac.in' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Cross-tenant PII read on another student profile',
    operation: 'get',
    path: '/users/userA',
    auth: { uid: 'userB', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Collection list scraping on /users',
    operation: 'list',
    path: '/users',
    auth: { uid: 'userA', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow field privilege escalation (isAdmin: true)',
    operation: 'create',
    path: '/users/userA',
    auth: { uid: 'userA', email_verified: true },
    payload: {
      uid: 'userA',
      displayName: 'Avneet',
      email: 'avneet@dgu.ac.in',
      campusName: 'DBS Global University',
      monthlyAllowance: 8000,
      planTier: 'free',
      isAdmin: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Identity spoofing in expense userId field',
    operation: 'create',
    path: '/users/userA/expenses/exp1',
    auth: { uid: 'userA', email_verified: true },
    payload: {
      userId: 'userB',
      amount: 120,
      category: 'food',
      paymentMethod: 'upi',
      note: 'Campus chai',
      date: '2026-11-20',
      monthKey: '2026-11',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Orphaned expense write without parent user document',
    operation: 'create',
    path: '/users/userGhost/expenses/exp1',
    auth: { uid: 'userGhost', email_verified: true },
    payload: { userId: 'userGhost', amount: 50 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Negative amount poisoning on expense',
    operation: 'create',
    path: '/users/userA/expenses/exp2',
    auth: { uid: 'userA', email_verified: true },
    payload: {
      userId: 'userA',
      amount: -500,
      category: 'food',
      paymentMethod: 'upi',
      note: 'Refund hack',
      date: '2026-11-20',
      monthKey: '2026-11',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'ID poisoning with oversized / invalid characters',
    operation: 'create',
    path: `/users/userA/expenses/${'x'.repeat(200)}`,
    auth: { uid: 'userA', email_verified: true },
    payload: { userId: 'userA', amount: 40 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Client-forged createdAt timestamp backdating',
    operation: 'create',
    path: '/users/userA/expenses/exp3',
    auth: { uid: 'userA', email_verified: true },
    payload: {
      userId: 'userA',
      amount: 80,
      createdAt: '2020-01-01T00:00:00Z',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Immutable createdAt mutation on expense update',
    operation: 'update',
    path: '/users/userA/expenses/exp1',
    auth: { uid: 'userA', email_verified: true },
    payload: { createdAt: 'request.time' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Terminal state tampering on completed SavingsGoal',
    operation: 'update',
    path: '/users/userA/goals/goal1',
    auth: { uid: 'userA', email_verified: true },
    payload: { savedAmount: 100 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unbounded or wrong-type completedDays array on HabitChallenge',
    operation: 'update',
    path: '/users/userA/challenges/ch1',
    auth: { uid: 'userA', email_verified: true },
    payload: { completedDays: [12345] },
    expected: 'PERMISSION_DENIED',
  },
];
