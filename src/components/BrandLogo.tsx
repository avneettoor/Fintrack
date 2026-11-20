export function BrandLogo({
  size = 'md',
  showTagline = false,
}: {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}) {
  const iconDim = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const textClass =
    size === 'sm'
      ? 'text-base'
      : size === 'lg'
        ? 'text-xl'
        : 'text-lg';

  return (
    <div className="inline-flex items-center gap-2.5 shrink-0">
      <svg
        viewBox="0 0 36 36"
        className={`${iconDim} shrink-0`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="36" height="36" rx="9" fill="#172B4D" />
        {/* Wallet outline */}
        <rect
          x="7"
          y="10"
          width="22"
          height="16"
          rx="3"
          stroke="#FFFFFF"
          strokeWidth="1.9"
        />
        <path
          d="M22 18C22 16.8954 22.8954 16 24 16H29V20H24C22.8954 20 22 19.1046 22 18Z"
          fill="#18A879"
        />
        {/* Upward financial growth trend */}
        <path
          d="M10.5 21.5L14.5 17.5L17.5 19.5L22.5 13.5"
          stroke="#18A879"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19.5 13.5H22.5V16.5"
          stroke="#18A879"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="leading-none">
        <span
          className={`font-display ${textClass} font-bold tracking-tight text-[#172B4D] dark:text-white whitespace-nowrap`}
        >
          FinTrack <span className="text-[#18A879]">Campus</span>
        </span>
        {showTagline && (
          <span className="block text-[11px] font-medium text-[#8490A5] dark:text-slate-400 mt-1 whitespace-nowrap">
            Your Money. Your Control. Your Future.
          </span>
        )}
      </div>
    </div>
  );
}
