import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'bg-royal-700 text-white hover:bg-royal-800 focus:ring-royal-500/30 shadow-sm',
  navy:
    'bg-navy-900 text-white hover:bg-navy-800 focus:ring-navy-700/30 shadow-sm',
  secondary:
    'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-300/40',
  soft:
    'bg-royal-50 text-royal-700 hover:bg-royal-100 focus:ring-royal-500/20',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/30 shadow-sm',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-5 py-3 text-base rounded-xl gap-2.5',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-150 focus:outline-none focus:ring-4 disabled:opacity-55 disabled:cursor-not-allowed active:scale-[0.99] ${
        VARIANTS[variant] || VARIANTS.primary
      } ${SIZES[size] || SIZES.md} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}