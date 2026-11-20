import React, { useEffect, useState } from 'react';
import { Check, Download, Moon, Sparkles, Sun, Trash2 } from 'lucide-react';
import {
  AgeGroup,
  CurrencyCode,
  MAX_AMOUNT,
  MAX_CAMPUS_NAME_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  NotificationPrefs,
  ThemeMode,
  Transaction,
  UserProfile,
} from '../types/finance';

interface SettingsTabProps {
  profile: UserProfile;
  transactions: Transaction[];
  seedingDemo: boolean;
  onUpdateProfile: (input: {
    displayName: string;
    campusName: string;
    ageGroup: AgeGroup;
    currency: CurrencyCode;
    monthlyAllowance: number;
    monthlyBudget: number;
    savingsTarget: number;
    photoURL?: string;
  }) => Promise<void>;
  onUpdateTheme: (theme: ThemeMode) => Promise<void>;
  onUpdateNotificationPrefs: (prefs: NotificationPrefs) => Promise<void>;
  onChangePassword: (newPassword: string) => Promise<void>;
  onSendPasswordReset: (email: string) => Promise<boolean>;
  onSeedDemo: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

export function SettingsTab({
  profile,
  transactions,
  seedingDemo,
  onUpdateProfile,
  onUpdateTheme,
  onUpdateNotificationPrefs,
  onChangePassword,
  onSendPasswordReset,
  onSeedDemo,
  onDeleteAccount,
}: SettingsTabProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [campusName, setCampusName] = useState(profile.campusName);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>(profile.ageGroup);
  const [currency, setCurrency] = useState<CurrencyCode>(profile.currency);
  const [monthlyAllowance, setMonthlyAllowance] = useState(String(profile.monthlyAllowance));
  const [monthlyBudget, setMonthlyBudget] = useState(String(profile.monthlyBudget));
  const [savingsTarget, setSavingsTarget] = useState(String(profile.savingsTarget));
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(profile.displayName);
    setCampusName(profile.campusName);
    setAgeGroup(profile.ageGroup);
    setCurrency(profile.currency);
    setMonthlyAllowance(String(profile.monthlyAllowance));
    setMonthlyBudget(String(profile.monthlyBudget));
    setSavingsTarget(String(profile.savingsTarget));
  }, [profile]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await onUpdateProfile({
        displayName,
        campusName,
        ageGroup,
        currency,
        monthlyAllowance: Math.min(MAX_AMOUNT, Math.max(0, Number(monthlyAllowance) || 0)),
        monthlyBudget: Math.min(MAX_AMOUNT, Math.max(0, Number(monthlyBudget) || 0)),
        savingsTarget: Math.min(MAX_AMOUNT, Math.max(0, Number(savingsTarget) || 0)),
        photoURL: profile.photoURL,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleExportJSON = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: {
        displayName: profile.displayName,
        email: profile.email,
        campusName: profile.campusName,
        currency: profile.currency,
        monthlyAllowance: profile.monthlyAllowance,
        monthlyBudget: profile.monthlyBudget,
      },
      transactions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'fintrack-campus-backup.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwMessage(null);
    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters.');
      return;
    }
    try {
      await onChangePassword(newPassword);
      setNewPassword('');
      setPwMessage('Password updated successfully.');
    } catch (err) {
      setPwError(
        err instanceof Error
          ? err.message
          : 'Could not update password. Try sending a reset email instead.'
      );
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    setDeleteError(null);
    try {
      await onDeleteAccount();
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : 'For security, please log out and log back in before deleting your account.'
      );
      setDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Personal Profile, College Info, Currency & Budget Preferences */}
      <form
        onSubmit={handleProfileSave}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="font-display text-base font-bold text-[#172B4D] dark:text-white">
              Personal Profile &amp; Budget Preferences
            </h2>
            <p className="text-xs text-[#8490A5] mt-0.5">{profile.email}</p>
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#18A879] hover:bg-[#149369] disabled:opacity-60 rounded-xl transition-colors"
          >
            {profileSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved</span>
              </>
            ) : (
              <span>{savingProfile ? 'Saving...' : 'Save Preferences'}</span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="set-name" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
              Full Name
            </label>
            <input
              id="set-name"
              type="text"
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="mt-1.5 w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="set-campus" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
              College / University
            </label>
            <input
              id="set-campus"
              type="text"
              maxLength={MAX_CAMPUS_NAME_LENGTH}
              value={campusName}
              onChange={(e) => setCampusName(e.target.value)}
              required
              className="mt-1.5 w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="set-age" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
              Age Group
            </label>
            <select
              id="set-age"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
              className="mt-1.5 w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white"
            >
              <option value="18-20">18–20</option>
              <option value="21-22">21–22</option>
              <option value="23-25">23–25</option>
              <option value="25+">25+</option>
            </select>
          </div>

          <div>
            <label htmlFor="set-currency" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
              Currency
            </label>
            <select
              id="set-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="mt-1.5 w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white"
            >
              <option value="INR">Indian Rupee (₹ INR)</option>
              <option value="USD">US Dollar ($ USD)</option>
              <option value="EUR">Euro (€ EUR)</option>
            </select>
          </div>

          <div>
            <label htmlFor="set-allowance" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
              Expected Monthly Allowance
            </label>
            <input
              id="set-allowance"
              type="number"
              min="0"
              max={MAX_AMOUNT}
              value={monthlyAllowance}
              onChange={(e) => setMonthlyAllowance(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2 text-sm font-mono-nums border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="set-budget" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
              Monthly Spending Budget
            </label>
            <input
              id="set-budget"
              type="number"
              min="0"
              max={MAX_AMOUNT}
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2 text-sm font-mono-nums border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="set-savings" className="block text-xs font-medium text-[#253047] dark:text-slate-300">
              Monthly Savings Target
            </label>
            <input
              id="set-savings"
              type="number"
              min="0"
              max={MAX_AMOUNT}
              value={savingsTarget}
              onChange={(e) => setSavingsTarget(e.target.value)}
              className="mt-1.5 w-full px-3.5 py-2 text-sm font-mono-nums border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white"
            />
          </div>
        </div>
      </form>

      {/* Theme Preferences (Light Mode & Dark Mode) */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="font-display text-base font-bold text-[#172B4D] dark:text-white">
            Theme Preferences
          </h2>
          <p className="text-xs text-[#8490A5] mt-0.5">
            Switch between Light Mode and Dark Mode across all charts and tables.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => onUpdateTheme('light')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
              profile.theme === 'light'
                ? 'bg-white text-[#172B4D] shadow-sm'
                : 'text-[#8490A5] hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light Mode</span>
          </button>
          <button
            type="button"
            onClick={() => onUpdateTheme('dark')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
              profile.theme === 'dark'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-[#8490A5] hover:text-[#172B4D]'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark Mode</span>
          </button>
        </div>
      </section>

      {/* Notification Settings */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
        <h2 className="font-display text-base font-bold text-[#172B4D] dark:text-white">
          Notification Settings
        </h2>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {(
            [
              {
                key: 'budgetAlerts',
                label: 'Category & Monthly Budget Alerts',
                desc: 'Notify when spending reaches 70%, 90%, or exceeds 100% of a cap.',
              },
              {
                key: 'goalMilestones',
                label: 'Savings Goal Milestones',
                desc: 'Celebrate when any savings goal reaches 50% or 100%.',
              },
              {
                key: 'challengeAlerts',
                label: 'Money Challenge Completions',
                desc: 'Notify when you complete a daily discipline challenge.',
              },
              {
                key: 'inactivityReminders',
                label: '3-Day Logging Reminders',
                desc: 'Remind me if no expense has been recorded for 3 consecutive days.',
              },
            ] as { key: keyof NotificationPrefs; label: string; desc: string }[]
          ).map((item) => (
            <label
              key={item.key}
              className="py-3 flex items-center justify-between gap-4 cursor-pointer"
            >
              <div>
                <p className="text-sm font-semibold text-[#172B4D] dark:text-white">{item.label}</p>
                <p className="text-xs text-[#8490A5]">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={profile.notificationPrefs[item.key]}
                onChange={(e) =>
                  onUpdateNotificationPrefs({
                    ...profile.notificationPrefs,
                    [item.key]: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-[#18A879]"
              />
            </label>
          ))}
        </div>
      </section>

      {/* Password Management & Data Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="font-display text-base font-bold text-[#172B4D] dark:text-white">
            Password Management
          </h2>
          {pwMessage && <p className="text-xs text-[#16A36A]">{pwMessage}</p>}
          {pwError && <p className="text-xs text-[#E56B6F]">{pwError}</p>}

          <form onSubmit={handlePasswordUpdate} className="space-y-3">
            <input
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-[#172B4D] dark:text-white"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#172B4D] hover:bg-[#10203a] rounded-xl"
              >
                Update Password
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await onSendPasswordReset(profile.email);
                  if (ok) setPwMessage(`Reset email sent to ${profile.email}.`);
                }}
                className="px-3 py-2 text-xs font-semibold text-[#18A879] hover:underline"
              >
                Send Reset Email
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
          <h2 className="font-display text-base font-bold text-[#172B4D] dark:text-white">
            Data Export &amp; Privacy
          </h2>
          <p className="text-xs text-[#8490A5] leading-relaxed">
            Your financial records are strictly scoped to your authenticated user ID in Cloud
            Firestore. Export a complete backup anytime.
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportJSON}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#172B4D] dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON Backup</span>
            </button>
            <button
              type="button"
              onClick={onSeedDemo}
              disabled={seedingDemo}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#18A879] bg-[#18A879]/10 hover:bg-[#18A879]/15 rounded-xl"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{seedingDemo ? 'Loading...' : 'Load Sample Demo Data'}</span>
            </button>
          </div>
        </section>
      </div>

      {/* Account Deletion */}
      <section className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 space-y-3">
        <h2 className="font-display text-base font-bold text-[#E56B6F]">Delete Account</h2>
        <p className="text-xs text-[#8490A5]">
          Permanently remove your FinTrack Campus profile, transactions, wallets, budgets, goals,
          and challenge history. This cannot be undone.
        </p>
        {deleteError && <p className="text-xs text-[#E56B6F]">{deleteError}</p>}

        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#E56B6F] bg-red-50 dark:bg-red-950/40 hover:bg-red-100 rounded-xl"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete My Account</span>
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              disabled={deletingAccount}
              onClick={handleDeleteAccount}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#E56B6F] hover:bg-red-600 rounded-xl"
            >
              {deletingAccount ? 'Deleting...' : 'Confirm Permanent Deletion'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-2 text-xs font-semibold text-[#8490A5]"
            >
              Cancel
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
