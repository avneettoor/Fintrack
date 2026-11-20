import { useState } from 'react';
import { BookOpen, CheckCircle2, ChevronRight } from 'lucide-react';
import { FinanceArticle, LEARN_ARTICLES } from '../types/finance';

interface LearnFinanceTabProps {
  readArticleIds: string[];
  onToggleArticleRead: (articleId: string) => Promise<void>;
}

export function LearnFinanceTab({ readArticleIds, onToggleArticleRead }: LearnFinanceTabProps) {
  const [selectedArticle, setSelectedArticle] = useState<FinanceArticle>(LEARN_ARTICLES[0]);
  const [updating, setUpdating] = useState(false);

  const completedCount = LEARN_ARTICLES.filter((a) => readArticleIds.includes(a.id)).length;
  const progressPct = Math.round((completedCount / LEARN_ARTICLES.length) * 100);
  const isRead = readArticleIds.includes(selectedArticle.id);

  const handleToggle = async () => {
    setUpdating(true);
    try {
      await onToggleArticleRead(selectedArticle.id);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Reading Progress Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
        <div>
          <p className="text-xs font-semibold text-[#18A879]">
            Financial Education · Educational Only, Not Investment Advice
          </p>
          <h2 className="mt-1 font-display text-lg font-bold text-[#172B4D] dark:text-white">
            Student Money Playbook
          </h2>
          <p className="mt-0.5 text-xs text-[#8490A5] font-mono-nums">
            {completedCount} of {LEARN_ARTICLES.length} articles completed ({progressPct}%)
          </p>
        </div>

        <div className="w-full sm:w-56">
          <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#18A879] rounded-full transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Article Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Article List */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-800 shadow-xs">
          {LEARN_ARTICLES.map((art) => {
            const done = readArticleIds.includes(art.id);
            const active = selectedArticle.id === art.id;
            return (
              <button
                key={art.id}
                type="button"
                onClick={() => setSelectedArticle(art)}
                className={`w-full px-5 py-4 text-left flex items-center justify-between gap-3 transition-colors ${
                  active
                    ? 'bg-[#18A879]/10'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-[#8490A5]">
                    {art.topic} · {art.readTime}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-[#172B4D] dark:text-white truncate">
                    {art.title}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {done && <CheckCircle2 className="w-4 h-4 text-[#16A36A]" />}
                  <ChevronRight className="w-4 h-4 text-[#8490A5]" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Article Reader */}
        <article className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-xs font-semibold text-[#18A879]">
                {selectedArticle.topic} · {selectedArticle.readTime}
              </p>
              <h3 className="mt-1 font-display text-2xl font-bold text-[#172B4D] dark:text-white">
                {selectedArticle.title}
              </h3>
            </div>

            <button
              type="button"
              disabled={updating}
              onClick={handleToggle}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
                isRead
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#16A36A]'
                  : 'bg-[#18A879] text-white hover:bg-[#149369]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isRead ? 'Completed' : 'Mark as Completed'}</span>
            </button>
          </div>

          <p className="text-sm font-medium text-[#253047] dark:text-slate-200 leading-relaxed">
            {selectedArticle.summary}
          </p>

          <div className="space-y-4 text-sm text-[#253047]/85 dark:text-slate-300 leading-relaxed">
            {selectedArticle.body.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>

          <div className="p-5 rounded-xl bg-[#F7F9FC] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800">
            <p className="inline-flex items-center gap-2 text-xs font-bold text-[#172B4D] dark:text-white">
              <BookOpen className="w-4 h-4 text-[#18A879]" />
              Key Student Takeaways
            </p>
            <ul className="mt-3 space-y-2 text-xs text-[#253047] dark:text-slate-300 list-disc pl-4">
              {selectedArticle.takeaways.map((tk) => (
                <li key={tk}>{tk}</li>
              ))}
            </ul>
          </div>
        </article>
      </div>
    </div>
  );
}
