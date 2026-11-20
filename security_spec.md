# FinTrack Campus Security Specification (Phase 0)

## 1. Data Invariants
1. **PII & Profile Isolation**: `users/{userId}` contains sensitive PII (`email`, `displayName`). Only the verified owner (`request.auth.uid == userId && request.auth.token.email_verified == true`) can `get`, `create`, or `update` their own profile. `list` and `delete` on `/users` are strictly denied.
2. **Master Gate Parent Integrity**: Every subcollection document (`expenses`, `budgets`, `goals`, `challenges`) under `/users/{userId}` must belong to an existing user profile (`existsAfter(/databases/$(database)/documents/users/$(userId))`) and match `userId == request.auth.uid` on both the path variable and the document's `userId` field.
3. **Immutable Ownership & Timestamps**: `uid`, `userId`, and `createdAt` are immutable after creation. `createdAt == request.time` on create; `updatedAt == request.time` on create and update.
4. **Strict Volumetric & Type Boundaries**: Every string has explicit `.size()` limits, every enum is allowlisted, numeric amounts are bounded (`> 0` or `>= 0` and `<= 10000000`), and `completedDays` arrays are capped at `<= 90` entries with first-element regex validation.
5. **Terminal State Locking**: Once a `SavingsGoal` or `HabitChallenge` reaches `status == 'completed'`, subsequent updates are rejected (though the owner may delete the record).
6. **Zero Unverified Writes & Zero Shadow Fields**: All writes require `request.auth.token.email_verified == true` and strict `hasAll` + `hasOnly` (create) or `affectedKeys().hasOnly(...)` (update).

## 2. The "Dirty Dozen" Malicious Payloads
1. **Unverified Email Spoof**: Signed-in user with `email_verified: false` attempts to create `/users/{uid}`. -> `PERMISSION_DENIED`.
2. **Cross-Tenant Profile Read**: User B attempts `get(/users/userA)` to read User A's email/allowance. -> `PERMISSION_DENIED`.
3. **Directory Enumeration (List Users)**: User A attempts `list(/users)` to scrape all student emails. -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Profile**: User A creates `/users/userA` with `{ ..., isAdmin: true, role: 'admin' }`. -> `PERMISSION_DENIED`.
5. **Identity Spoofing on Expense**: User A creates `/users/userA/expenses/exp1` with `userId: 'userB'`. -> `PERMISSION_DENIED`.
6. **Orphaned Subcollection Write**: User A creates `/users/userA/expenses/exp1` before `/users/userA` exists (outside a batch). -> `PERMISSION_DENIED`.
7. **Negative / Overflow Amount Poisoning**: User A logs an expense with `amount: -500` or `amount: 999999999`. -> `PERMISSION_DENIED`.
8. **ID Poisoning (1.5KB Document ID)**: User A writes to `/users/userA/expenses/<200-char-string>` or invalid characters `$#`. -> `PERMISSION_DENIED`.
9. **Timestamp Backdating**: User A creates an expense with `createdAt: Timestamp(2020-01-01)` instead of `request.time`. -> `PERMISSION_DENIED`.
10. **Immutable Field Mutation**: User A updates an expense to change `createdAt` or `userId`. -> `PERMISSION_DENIED`.
11. **Terminal State Tampering**: User A updates a `SavingsGoal` whose `existing().status == 'completed'` to alter `savedAmount`. -> `PERMISSION_DENIED`.
12. **Unbounded Array Exhaustion**: User A updates a `HabitChallenge` with `completedDays` of 95 items or an integer element `[123]`. -> `PERMISSION_DENIED`.
