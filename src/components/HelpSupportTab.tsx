import { HelpCircle, ShieldCheck } from 'lucide-react';

export function HelpSupportTab() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-6 h-6 text-[#18A879]" />
          <div>
            <h2 className="font-display text-lg font-bold text-[#172B4D] dark:text-white">
              Help &amp; Campus Support
            </h2>
            <p className="text-xs text-[#8490A5]">
              Guides and answers for using FinTrack Campus across Dehradun &amp; Indian campuses
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            q: 'How do wallet transfers affect my monthly stats?',
            a: 'Moving money from Bank Account to UPI Wallet or Savings Wallet updates each wallet balance, while Monthly Income and Monthly Expenses remain untouched.',
          },
          {
            q: 'How is Daily Safe-to-Spend calculated?',
            a: 'Safe-to-Spend divides (Monthly Budget − Current Month Expenses) by the number of days remaining in the selected month.',
          },
          {
            q: 'How do budget alert notifications trigger?',
            a: 'FinTrack Campus checks your category and monthly budget usage automatically and raises in-app notifications at 70%, 90%, and 100%+ consumption.',
          },
          {
            q: 'Can I switch between Light Mode and Dark Mode?',
            a: 'Yes! Open Settings from the left sidebar and toggle between Light Mode and Dark Mode anytime.',
          },
        ].map((item) => (
          <div
            key={item.q}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs"
          >
            <h3 className="font-display text-sm font-bold text-[#172B4D] dark:text-white">
              {item.q}
            </h3>
            <p className="mt-2 text-xs text-[#8490A5] leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-[#18A879] shrink-0 mt-0.5" />
        <div className="text-xs text-[#8490A5] leading-relaxed">
          <strong className="text-[#172B4D] dark:text-white">Educational Notice:</strong> FinTrack
          Campus provides personal budgeting tools and financial literacy education. It does not
          offer regulated investment, loan, or tax advisory services.
        </div>
      </div>
    </div>
  );
}
