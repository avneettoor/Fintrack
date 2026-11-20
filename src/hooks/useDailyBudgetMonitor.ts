import { useCallback, useEffect, useRef, useState } from 'react';
import { ToastItem } from '../components/ToastNotifications';
import {
  AppNotification,
  CategoryBudget,
  computeDailySpendAllowance,
  DailyThresholdTier,
  formatCurrency,
  getCurrentMonthKey,
  getTodayISO,
  Transaction,
  UserProfile,
} from '../types/finance';

interface UseDailyBudgetMonitorParams {
  activeProfile: UserProfile | null;
  transactions: Transaction[];
  budgets: CategoryBudget[];
  loadingData: boolean;
  isDemo: boolean;
  onNotifyPersistent: (
    dedupeKey: string,
    payload: { title: string; message: string; kind: AppNotification['kind'] }
  ) => void;
  onReviewSpends: () => void;
}

const CHECK_INTERVAL_MS = 30_000;
const WARNING_TOAST_DURATION_MS = 8_000;
const EXCEEDED_TOAST_DURATION_MS = 10_000;

export function useDailyBudgetMonitor({
  activeProfile,
  transactions,
  budgets,
  loadingData,
  isDemo,
  onNotifyPersistent,
  onReviewSpends,
}: UseDailyBudgetMonitorParams) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [todayTick, setTodayTick] = useState<string>(() => getTodayISO());

  const lastAlertedRef = useRef<{
    dateISO: string;
    tier: DailyThresholdTier;
    spentToday: number;
    dailyLimit: number;
  }>({
    dateISO: '',
    tier: 'ok',
    spentToday: 0,
    dailyLimit: 0,
  });

  const dismissTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = dismissTimersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      dismissTimersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (
      item: Omit<ToastItem, 'id' | 'createdAt'>,
      durationMs: number
    ) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const nextToast: ToastItem = {
        ...item,
        id,
        createdAt: Date.now(),
      };
      setToasts((prev) => [nextToast, ...prev].slice(0, 3));

      const timer = setTimeout(() => {
        dismissTimersRef.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, durationMs);
      dismissTimersRef.current.set(id, timer);
    },
    []
  );

  // Clean up pending dismiss timers on unmount
  useEffect(() => {
    const timers = dismissTimersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  // Reset tracking when switching between Live & Demo modes or user accounts
  useEffect(() => {
    lastAlertedRef.current = {
      dateISO: '',
      tier: 'ok',
      spentToday: 0,
      dailyLimit: 0,
    };
    setToasts([]);
  }, [isDemo, activeProfile?.uid]);

  const runDailyCheck = useCallback(() => {
    const currentTodayISO = getTodayISO();
    if (currentTodayISO !== todayTick) {
      setTodayTick(currentTodayISO);
    }

    if (!activeProfile || loadingData) return;
    if (activeProfile.notificationPrefs?.budgetAlerts === false) return;

    const currentMonthKey = getCurrentMonthKey();
    const monthBudgetsTotal = budgets
      .filter((b) => b.monthKey === currentMonthKey)
      .reduce((sum, b) => sum + b.limitAmount, 0);
    const effectiveMonthlyBudget =
      (activeProfile.monthlyBudget || 0) > 0
        ? activeProfile.monthlyBudget
        : monthBudgetsTotal;

    if (effectiveMonthlyBudget <= 0) return;

    const allowance = computeDailySpendAllowance(
      transactions,
      currentMonthKey,
      effectiveMonthlyBudget
    );

    const prev = lastAlertedRef.current;
    const isNewDay = prev.dateISO !== currentTodayISO;
    const currency = activeProfile.currency || 'INR';

    if (allowance.dailyThresholdTier === 'ok') {
      lastAlertedRef.current = {
        dateISO: currentTodayISO,
        tier: 'ok',
        spentToday: allowance.spentToday,
        dailyLimit: allowance.dailyLimit,
      };
      return;
    }

    if (allowance.dailyThresholdTier === 'warning_90') {
      const shouldAlertWarning =
        isNewDay ||
        prev.tier === 'ok' ||
        (prev.tier === 'warning_90' && allowance.spentToday > prev.spentToday);

      if (shouldAlertWarning) {
        const remainingToday = Math.max(0, allowance.remainingToday);
        pushToast(
          {
            variant: 'warning',
            title: 'Approaching Daily Spending Limit (90%+)',
            message: `You have spent ${formatCurrency(allowance.spentToday, currency)} of today's ${formatCurrency(allowance.dailyLimit, currency)} limit (${allowance.dailyCapacityPct}%). Only ${formatCurrency(remainingToday, currency)} left today.`,
            progressPct: allowance.dailyCapacityPct,
            actionLabel: 'Review Spends',
            onAction: onReviewSpends,
          },
          WARNING_TOAST_DURATION_MS
        );

        onNotifyPersistent(`daily_cap_90_${currentTodayISO}_${allowance.dailyLimit}`, {
          title: 'Daily Limit Warning (90%+)',
          message: `Spent ${formatCurrency(allowance.spentToday, currency)} out of today's ${formatCurrency(allowance.dailyLimit, currency)} safe limit (${formatCurrency(remainingToday, currency)} left).`,
          kind: 'budget_warning',
        });
      }

      lastAlertedRef.current = {
        dateISO: currentTodayISO,
        tier: 'warning_90',
        spentToday: allowance.spentToday,
        dailyLimit: allowance.dailyLimit,
      };
      return;
    }

    // dailyThresholdTier === 'exceeded_100'
    const shouldAlertExceeded =
      isNewDay ||
      prev.tier !== 'exceeded_100' ||
      allowance.spentToday > prev.spentToday;

    if (shouldAlertExceeded) {
      const overAmount = Math.abs(Math.min(0, allowance.remainingToday));
      pushToast(
        {
          variant: 'exceeded',
          title: 'Daily Spending Limit Exceeded!',
          message:
            allowance.dailyLimit > 0
              ? `After essentials, today's limit was ${formatCurrency(allowance.dailyLimit, currency)}. You spent ${formatCurrency(allowance.spentToday, currency)} today (${formatCurrency(overAmount, currency)} over).`
              : `No remaining daily allowance for today, and you spent ${formatCurrency(allowance.spentToday, currency)} today.`,
          progressPct: allowance.dailyCapacityPct,
          actionLabel: 'Review Spends',
          onAction: onReviewSpends,
        },
        EXCEEDED_TOAST_DURATION_MS
      );

      onNotifyPersistent(`daily_cap_100_${currentTodayISO}_${allowance.dailyLimit}`, {
        title: 'Daily Spend Limit Exceeded',
        message: `After necessary payments, today's limit was ${formatCurrency(allowance.dailyLimit, currency)}. You spent ${formatCurrency(allowance.spentToday, currency)} today (${formatCurrency(overAmount, currency)} over).`,
        kind: 'budget_exceeded',
      });
    }

    lastAlertedRef.current = {
      dateISO: currentTodayISO,
      tier: 'exceeded_100',
      spentToday: allowance.spentToday,
      dailyLimit: allowance.dailyLimit,
    };
  }, [
    activeProfile,
    budgets,
    loadingData,
    onNotifyPersistent,
    onReviewSpends,
    pushToast,
    todayTick,
    transactions,
  ]);

  // Immediate check whenever data changes
  useEffect(() => {
    runDailyCheck();
  }, [runDailyCheck]);

  // Continuous background check timer + window focus / tab visibility listeners
  useEffect(() => {
    const intervalId = setInterval(() => {
      runDailyCheck();
    }, CHECK_INTERVAL_MS);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        runDailyCheck();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [runDailyCheck]);

  return {
    toasts,
    dismissToast,
  };
}
