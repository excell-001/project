export default function Card({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = '',
}) {
  return (
    <div
      className={`bg-white border border-slate-200/90 rounded-2xl shadow-card overflow-hidden ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            {title && (
              <h3 className="font-display text-base font-bold text-navy-900">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
    </div>
  );
}