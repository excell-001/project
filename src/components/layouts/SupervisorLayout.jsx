import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  History,
  Building2,
  LogOut,
  Menu,
  X,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';
import BrandLogo from '../common/BrandLogo';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

const NAV_ITEMS = [
  { to: '/supervisor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/supervisor/supervisions', label: 'Kegiatan Supervisi', icon: ClipboardCheck },
  { to: '/supervisor/teachers', label: 'Data Guru', icon: Users },
  { to: '/supervisor/history', label: 'Riwayat & Rekap', icon: History },
  { to: '/supervisor/school', label: 'Identitas Sekolah', icon: Building2 },
];

function SupervisorSidebar({ profile, closeSidebar, navigate, handleLogout }) {
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

      <div className="px-4 pt-5 pb-2">
        <button
          type="button"
          onClick={() => {
            closeSidebar();
            navigate('/supervisor/supervisions/new');
          }}
          className="w-full flex items-center justify-center gap-2 bg-royal-600 hover:bg-royal-500 text-white font-semibold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Supervisi Baru
        </button>
      </div>

      <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-blue-300/60 mb-2">
          Menu Supervisor
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/15 text-white font-semibold shadow-xs'
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
            {profile?.full_name?.charAt(0)?.toUpperCase() || 'K'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {profile?.full_name || 'Kepala Sekolah'}
            </p>
            <p className="text-[11px] text-blue-200/75 truncate">
              Supervisor / Kepala Sekolah
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

export default function SupervisorLayout() {
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
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 sticky top-0 h-screen">
        <SupervisorSidebar
          profile={profile}
          closeSidebar={() => setSidebarOpen(false)}
          navigate={navigate}
          handleLogout={handleLogout}
        />
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">
            <SupervisorSidebar
              profile={profile}
              closeSidebar={() => setSidebarOpen(false)}
              navigate={navigate}
              handleLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
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
                Tahun Pelajaran {profile?.school?.academic_year_default || '2026/2027'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-navy-50 text-navy-900 border border-navy-100">
              Mode Supervisor
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}