import React, { useEffect, useState } from 'react';
import { Check, LogOut, Sparkles } from 'lucide-react';
import {
  MAX_ALLOWANCE_AMOUNT,
  MAX_CAMPUS_NAME_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  PlanTier,
  UserProfile,
} from '../types/finance';

interface ProfilePlanTabProps {
  profile: UserProfile | null;
  onUpdateProfile: (updates: {
    displayName: string;
    campusName: string;
    monthlyAllowance: number;
    photoURL?: string;
  }) => Promise<void>;
  onUpdatePlanTier: (tier: PlanTier) => Promise<void>;
  onSeedSample: () => Promise<void>;
  seedingSample: boolean;
  onSignOut: () => Promise<void>;
}

export function ProfilePlanTab({
  profile,
  onUpdateProfile,
  onUpdatePlanTier,
  onSeedSample,
  seedingSample,
  onSignOut,
}: ProfilePlanTabProps) {
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [campusName, setCampusName] = useState(profile?.campusName || '');
  const [allowance, setAllowance] = useState(String(profile?.monthlyAllowance ?? 8000));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [updatingTier, setUpdatingTier] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setCampusName(profile.campusName);
    setAllowance(String(profile.monthlyAllowance));
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAllowance = Number(allowance);
    if (!Number.isFinite(numericAllowance) || numericAllowance < 0) return;

    setSaving(true);
    try {
      await onUpdateProfile({
        displayName,
        campusName,
        monthlyAllowance: Math.min(MAX_ALLOWANCE_AMOUNT, numericAllowance),
        photoURL: profile?.photoURL,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCampusPlus = async () => {
    if (!profile) return;
    setUpdatingTier(true);
    try {
      const next: PlanTier =
        profile.planTier === 'campus_plus_interest' ? 'free' : 'campus_plus_interest';
      await onUpdatePlanTier(next);
    } finally {
      setUpdatingTier(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Google Account & Student Profile */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="flex items-center gap-4">
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-teal-700 text-white flex items-center justify-center font-display font-bold text-lg">
                {(profile?.displayName || 'S').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                {profile?.displayName || 'Campus Student'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {profile?.email} · Google Verified
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-name" className="block text-xs font-medium text-slate-700">
              Student Name
            </label>
            <input
              id="profile-name"
              type="text"
              maxLength={MAX_DISPLAY_NAME_LENGTH}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="mt-1.5 w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label htmlFor="profile-allowance" className="block text-xs font-medium text-slate-700">
              Default Monthly Allowance (INR)
            </label>
            <input
              id="profile-allowance"
              type="number"
              min="0"
              max={MAX_ALLOWANCE_AMOUNT}
              value={allowance}
              onChange={(e) => setAllowance(e.target.value)}
              required
              className="mt-1.5 w-full px-3.5 py-2 text-sm font-mono-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="profile-campus" className="block text-xs font-medium text-slate-700">
              College / University
            </label>
            <input
              id="profile-campus"
              type="text"
              maxLength={MAX_CAMPUS_NAME_LENGTH}
              value={campusName}
              onChange={(e) => setCampusName(e.target.value)}
              placeholder="DBS Global University, Dehradun"
              required
              className="mt-1.5 w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="sm:col-span-2 pt-2 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onSeedSample}
              disabled={seedingSample}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-700" />
              <span>{seedingSample ? 'Adding Sample Month...' : 'Add Sample Campus Data'}</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Profile Saved</span>
                </>
              ) : (
                <span>{saving ? 'Saving...' : 'Save Profile'}</span>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Freemium & Campus Plus Validation Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-teal-800">
              Current Plan ·{' '}
              {profile?.planTier === 'campus_plus_interest'
                ? 'Free Core (Campus Plus Early Access Requested)'
                : 'Free Core Plan'}
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold text-slate-900">
              Campus Plus — Rs. 49 / month
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 max-w-xl">
              FinTrack Campus keeps core daily expense tracking and budgeting free for every student.
              Campus Plus adds month-end spending forecasts, category leak alerts, and student perks
              at Rs. 49/month.
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleCampusPlus}
            disabled={updatingTier}
            className={`px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              profile?.planTier === 'campus_plus_interest'
                ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {updatingTier
              ? 'Updating...'
              : profile?.planTier === 'campus_plus_interest'
                ? 'Early Access Joined (Rs. 49/mo)'
                : 'Express Interest in Rs. 49/mo Plan'}
          </button>
        </div>
      </section>
    </div>
  );
}
