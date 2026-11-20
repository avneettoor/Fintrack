import { AlertTriangle, BellRing, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export interface ToastItem {
  id: string;
  variant: 'warning' | 'exceeded' | 'info';
  title: string;
  message: string;
  progressPct?: number;
  actionLabel?: string;
  onAction?: () => void;
  createdAt: number;
}

interface ToastNotificationsProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastNotifications({ toasts, onDismiss }: ToastNotificationsProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-20 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm flex flex-col gap-3 pointer-events-none"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const isExceeded = toast.variant === 'exceeded';
          const isWarning = toast.variant === 'warning';
          const cappedPct =
            typeof toast.progressPct === 'number'
              ? Math.max(0, Math.min(100, toast.progressPct))
              : null;

          return (
            <motion.div
              key={toast.id}
              role={isExceeded ? 'alert' : 'status'}
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className={`pointer-events-auto rounded-2xl border shadow-lg backdrop-blur-md p-4 ${
                isExceeded
                  ? 'bg-white/95 dark:bg-slate-900/95 border-[#E56B6F]/60 shadow-red-500/10'
                  : isWarning
                    ? 'bg-white/95 dark:bg-slate-900/95 border-[#F4B544]/70 shadow-amber-500/10'
                    : 'bg-white/95 dark:bg-slate-900/95 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isExceeded
                      ? 'bg-[#FDEFEF] text-[#E56B6F] dark:bg-red-950/60'
                      : isWarning
                        ? 'bg-[#FEF7EA] text-[#F4B544] dark:bg-amber-950/60'
                        : 'bg-[#E8F7F2] text-[#18A879] dark:bg-emerald-950/60'
                  }`}
                >
                  {isExceeded ? (
                    <AlertTriangle className="w-4.5 h-4.5" />
                  ) : (
                    <BellRing className="w-4.5 h-4.5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-xs font-bold leading-snug ${
                        isExceeded
                          ? 'text-[#E56B6F]'
                          : isWarning
                            ? 'text-amber-700 dark:text-[#F4B544]'
                            : 'text-[#172B4D] dark:text-white'
                      }`}
                    >
                      {toast.title}
                    </p>
                    <button
                      type="button"
                      onClick={() => onDismiss(toast.id)}
                      className="p-0.5 -mr-1 -mt-0.5 rounded-lg text-[#8490A5] hover:text-[#172B4D] dark:hover:text-white transition-colors shrink-0"
                      aria-label="Dismiss notification"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="mt-1 text-xs text-[#253047] dark:text-slate-300 leading-relaxed">
                    {toast.message}
                  </p>

                  {cappedPct !== null && (
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between text-[11px] font-mono-nums mb-1">
                        <span className="text-[#8490A5] dark:text-slate-400">
                          Daily capacity used
                        </span>
                        <span
                          className={`font-bold ${
                            isExceeded
                              ? 'text-[#E56B6F]'
                              : isWarning
                                ? 'text-amber-700 dark:text-[#F4B544]'
                                : 'text-[#18A879]'
                          }`}
                        >
                          {toast.progressPct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-200"
                          style={{
                            width: `${cappedPct}%`,
                            backgroundColor: isExceeded
                              ? '#E56B6F'
                              : isWarning
                                ? '#F4B544'
                                : '#18A879',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {toast.actionLabel && toast.onAction && (
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          toast.onAction?.();
                          onDismiss(toast.id);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-colors ${
                          isExceeded
                            ? 'bg-[#E56B6F] hover:bg-red-600'
                            : isWarning
                              ? 'bg-[#F4B544] hover:bg-amber-500 text-[#172B4D]'
                              : 'bg-[#18A879] hover:bg-[#149369]'
                        }`}
                      >
                        {toast.actionLabel}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
