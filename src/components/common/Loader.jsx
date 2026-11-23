import { Loader2 } from 'lucide-react';

export default function Loader({ text = 'Memuat data...', fullScreen = false }) {
  if (fullScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-9 h-9 text-royal-700 animate-spin" />
        <p className="text-sm font-medium text-slate-600">{text}</p>
      </div>
    );
  }

  return (
    <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-slate-500">
      <Loader2 className="w-7 h-7 text-royal-700 animate-spin" />
      <p className="text-xs font-medium">{text}</p>
    </div>
  );
}