import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import BrandLogo from '../common/BrandLogo';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const TEACHER_NAV = [
  { to: '/teacher/dashboard', label: 'Dashboard Guru', icon: LayoutDashboard },
  { to: '/teacher/supervisions', label: 'Jadwal & Hasil Supervisi', icon: ClipboardList },
];

function TeacherSidebar({ profile, closeSidebar, handleLogout }) {
  return (
    <div className="flex flex-col h-full bg-navy-900 text-white">
      <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
        <BrandLogo light size="md" />
        <button
          type="button"
          onClick={closeSidebar}
          className="lg:hidden p-1.5 rounded-lg text-slate-300 hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-blue-300/60 mb-2">
          Portal Guru
        </p>
        {TEACHER_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/15 text-white font-semibold'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </span>
              <ChevronRight className="w-4 h-4 opacity-40" />
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 bg-navy-950/50">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-9 h-9 rounded-xl bg-royal-700 flex items-center justify-center font-display font-bold text-sm text-white shrink-0">
            {profile?.full_name?.charAt(0)?.toUpperCase() || 'G'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {profile?.full_name || 'Guru Mata Pelajaran'}
            </p>
            <p className="text-[11px] text-blue-200/75 truncate">
              {profile?.teacherRecord?.subject?.name || 'Tenaga Pendidik'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-200 bg-red-500/15 hover:bg-red-500/25 border border-red-400/20 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Keluar Aplikasi
        </button>
      </div>
    </div>
  );
}

export default function TeacherLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.info('Berhasil Keluar', 'Sesi Anda telah diakhiri.');
      navigate('/login');
    } catch (err) {
      toast.error('Gagal Keluar', err.message);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="hidden lg:block w-72 shrink-0 sticky top-0 h-screen">
        <TeacherSidebar
          profile={profile}
          closeSidebar={() => setSidebarOpen(false)}
          handleLogout={handleLogout}
        />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">
            <TeacherSidebar
              profile={profile}
              closeSidebar={() => setSidebarOpen(false)}
              handleLogout={handleLogout}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs font-semibold text-royal-700">
                {profile?.school?.name || 'Satuan Pendidikan'}
              </p>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                NIP. {profile?.nip || profile?.teacherRecord?.nip || '-'}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-royal-50 text-royal-700 border border-royal-100">
            Portal Guru
          </span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}