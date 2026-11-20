import { useCallback, useEffect, useRef, useState } from 'react';
import { PartyPopper, RotateCw, Trophy, X } from 'lucide-react';
import { CurrencyCode, formatCurrency } from '../types/finance';

export interface CelebrationPayload {
  title: string;
  subtitle: string;
  savedAmount: number;
  targetAmount: number;
  periodLabel: string;
}

interface CelebrationModalProps {
  isOpen: boolean;
  celebration: CelebrationPayload | null;
  currency: CurrencyCode;
  onClose: () => void;
}

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vr: number;
  alpha: number;
}

const CONFETTI_COLORS = ['#18A879', '#F4B544', '#4778E8', '#16A36A', '#E56B6F', '#FFFFFF'];

export function CelebrationModal({
  isOpen,
  celebration,
  currency,
  onClose,
}: CelebrationModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const [burstSeed, setBurstSeed] = useState(0);

  const launchConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces: ConfettiPiece[] = Array.from({ length: 110 }, (_, idx) => {
      const fromLeft = idx % 2 === 0;
      const startX = fromLeft ? canvas.width * 0.25 : canvas.width * 0.75;
      const angle = fromLeft
        ? -Math.PI / 2 + (Math.random() - 0.2) * 1.1
        : -Math.PI / 2 + (Math.random() - 0.8) * 1.1;
      const speed = 6 + Math.random() * 10;
      return {
        x: startX + (Math.random() - 0.5) * 60,
        y: canvas.height * 0.55,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 6 + Math.random() * 6,
        color: CONFETTI_COLORS[idx % CONFETTI_COLORS.length],
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.25,
        alpha: 1,
      };
    });

    if (animRef.current) cancelAnimationFrame(animRef.current);

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.28; // gravity
        p.vx *= 0.99;
        p.rotation += p.vr;
        if (p.y > canvas.height * 0.85) {
          p.alpha = Math.max(0, p.alpha - 0.025);
        }
        if (p.alpha > 0.02 && p.y < canvas.height + 40) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.65);
          ctx.restore();
        }
      }
      if (alive) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    launchConfetti();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isOpen, burstSeed, launchConfetti]);

  if (!isOpen || !celebration) return null;

  const pct =
    celebration.targetAmount > 0
      ? Math.round((celebration.savedAmount / celebration.targetAmount) * 100)
      : 100;
  const surplus = Math.max(0, celebration.savedAmount - celebration.targetAmount);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B4D]/65 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebration-modal-title"
    >
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50"
        aria-hidden="true"
      />

      <div className="relative z-50 w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close celebration"
          className="absolute top-4 right-4 p-2 text-[#8490A5] hover:text-[#172B4D] dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-[#18A879]/30 flex items-center justify-center text-[#18A879]">
          <PartyPopper className="w-8 h-8" />
        </div>

        <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#18A879]">
          <Trophy className="w-3.5 h-3.5 text-[#F4B544]" />
          <span>{celebration.periodLabel} · Milestone Unlocked</span>
        </p>

        <h2
          id="celebration-modal-title"
          className="mt-2 font-display text-2xl font-bold text-[#172B4D] dark:text-white"
        >
          {celebration.title}
        </h2>

        <p className="mt-2 text-sm text-[#8490A5] dark:text-slate-400 leading-relaxed">
          {celebration.subtitle}
        </p>

        <div className="mt-6 grid grid-cols-3 gap-2.5 bg-[#F7F9FC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <div>
            <p className="text-[11px] text-[#8490A5]">Saved</p>
            <p className="mt-0.5 font-mono-nums text-sm font-bold text-[#16A36A]">
              {formatCurrency(celebration.savedAmount, currency)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[#8490A5]">Goal Target</p>
            <p className="mt-0.5 font-mono-nums text-sm font-bold text-[#172B4D] dark:text-white">
              {formatCurrency(celebration.targetAmount, currency)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[#8490A5]">{surplus > 0 ? 'Bonus Saved' : 'Achieved'}</p>
            <p className="mt-0.5 font-mono-nums text-sm font-bold text-[#4778E8]">
              {surplus > 0 ? `+${formatCurrency(surplus, currency)}` : `${pct}%`}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setBurstSeed((s) => s + 1)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#172B4D] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Replay Confetti</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#18A879] hover:bg-[#149369] text-white text-sm font-semibold transition-colors"
          >
            Awesome, Keep Going!
          </button>
        </div>
      </div>
    </div>
  );
}
