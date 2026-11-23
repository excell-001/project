import { ShieldCheck } from 'lucide-react';

export default function BrandLogo({ light = false, size = 'md' }) {
  const sizes = {
    sm: { box: 'w-8 h-8 rounded-lg', icon: 'w-4 h-4', title: 'text-base', sub: 'text-[10px]' },
    md: { box: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5', title: 'text-lg', sub: 'text-[11px]' },
    lg: { box: 'w-12 h-12 rounded-2xl', icon: 'w-6 h-6', title: 'text-2xl', sub: 'text-xs' },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className="flex items-center gap-3 select-none">
      <div
        className={`${s.box} flex items-center justify-center shadow-sm ${
          light
            ? 'bg-white text-navy-900'
            : 'bg-gradient-to-br from-navy-900 to-royal-700 text-white'
        }`}
      >
        <ShieldCheck className={s.icon} strokeWidth={2.4} />
      </div>
      <div className="leading-tight">
        <span
          className={`font-display font-extrabold tracking-tight block ${s.title} ${
            light ? 'text-white' : 'text-navy-900'
          }`}
        >
          SuperVisi<span className={light ? 'text-blue-300' : 'text-royal-700'}>Pro</span>
        </span>
        <span
          className={`block font-medium tracking-wide ${s.sub} ${
            light ? 'text-blue-200/80' : 'text-slate-500'
          }`}
        >
          Education Supervision System
        </span>
      </div>
    </div>
  );
}