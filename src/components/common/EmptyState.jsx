import { FolderOpen } from 'lucide-react';

export default function EmptyState({
  icon: Icon = FolderOpen,
  title = 'Belum ada data',
  description = 'Data yang Anda cari belum tersedia saat ini.',
  action,
}) {
  return (
    <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
      <div className="w-12 h-12 rounded-2xl bg-royal-50 text-royal-700 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="font-display text-base font-bold text-navy-900">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}