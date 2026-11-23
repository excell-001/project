const BADGE_VARIANTS = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  purple: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
        BADGE_VARIANTS[variant] || BADGE_VARIANTS.default
      } ${className}`}
    >
      {children}
    </span>
  );
}