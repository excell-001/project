export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'royal',
}) {
  const accents = {
    royal: 'bg-royal-50 text-royal-700 border-royal-100',
    navy: 'bg-navy-50 text-navy-900 border-navy-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-card hover:shadow-elevated transition-shadow duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <p className="font-display text-2xl sm:text-3xl font-extrabold text-navy-900 mt-1.5 tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1.5 truncate">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div
            className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
              accents[accent] || accents.royal
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}