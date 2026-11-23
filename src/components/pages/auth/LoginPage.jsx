import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import BrandLogo from '../../common/BrandLogo';
import Button from '../../common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

const loginSchema = z.object({
  email: z.string().email('Masukkan alamat email yang valid'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter'),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const userProfile = await login(values);
      if (!userProfile) {
        setServerError('Profil akun tidak ditemukan. Pastikan SQL Schema sudah dijalankan.');
        return;
      }

      toast.success(
        `Selamat Datang, ${userProfile.full_name}`,
        `Masuk sebagai ${userProfile.role === 'supervisor' ? 'Kepala Sekolah / Supervisor' : 'Guru'}`
      );

      if (userProfile.role === 'supervisor') {
        navigate('/supervisor/dashboard', { replace: true });
      } else {
        navigate('/teacher/dashboard', { replace: true });
      }
    } catch (err) {
      setServerError(
        err.message === 'Invalid login credentials'
          ? 'Email atau kata sandi yang Anda masukkan salah.'
          : err.message
      );
    }
  };

  const fillDemoAccount = (roleType) => {
    if (roleType === 'supervisor') {
      setValue('email', 'kepsek@sekolah.sch.id');
      setValue('password', 'SuperVisi2026!');
    } else {
      setValue('email', 'guru.pai@sekolah.sch.id');
      setValue('password', 'GuruPAI2026!');
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-slate-50">
      {/* Panel Kiri: Identitas Institusi */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 bg-gradient-to-br from-navy-950 via-navy-900 to-royal-800 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <BrandLogo light size="lg" />
        </div>

        <div className="relative z-10 max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-blue-200">
            Platform Digitalisasi Supervisi Akademik
          </div>
          <h1 className="font-display text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
            Supervisi Pendidikan Lebih Terukur, Objektif, dan Terdokumentasi.
          </h1>
          <p className="text-blue-100/80 text-base leading-relaxed">
            Kelola instrumen perencanaan, pelaksanaan, dan evaluasi pembelajaran secara digital lengkap dengan unggahan perangkat ajar serta pengesahan tanda tangan PDF.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {[
              'Instrumen 3 Komponen (18 Indikator)',
              'Kalkulasi Skor & Kategori Otomatis',
              'Unggah RPP & Dokumentasi Kelas',
              'Laporan Rekap PDF & TTD Digital',
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2.5 text-sm text-blue-100 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
              >
                <CheckCircle2 className="w-4 h-4 text-blue-300 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-blue-200/60">
          © {new Date().getFullYear()} SuperVisiPro · Sistem Informasi Supervisi Pendidikan
        </p>
      </div>

      {/* Panel Kanan: Form Login */}
      <div className="lg:col-span-6 xl:col-span-5 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-7">
          <div className="lg:hidden">
            <BrandLogo size="md" />
          </div>

          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-navy-900">
              Masuk ke Akun Anda
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Gunakan akun Kepala Sekolah/Supervisor atau Guru yang telah terdaftar.
            </p>
          </div>

          {serverError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="nama@sekolah.sch.id"
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-royal-600 focus:ring-4 focus:ring-royal-600/15"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-royal-600 focus:ring-4 focus:ring-royal-600/15"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Tampilkan kata sandi"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="navy"
              size="lg"
              loading={isSubmitting}
              className="w-full mt-2"
            >
              Masuk ke Sistem
            </Button>
          </form>

          {/* Shortcut Kredensial Seed (untuk memudahkan pengujian setelah Phase 3) */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Isi Cepat Akun Pengujian (Seed Phase 3)
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillDemoAccount('supervisor')}
                className="text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-royal-300 hover:bg-royal-50/40 transition-colors"
              >
                <span className="block text-xs font-bold text-navy-900">Kepala Sekolah</span>
                <span className="block text-[11px] text-slate-500 truncate">
                  kepsek@sekolah.sch.id
                </span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('teacher')}
                className="text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-royal-300 hover:bg-royal-50/40 transition-colors"
              >
                <span className="block text-xs font-bold text-navy-900">Guru PAI</span>
                <span className="block text-[11px] text-slate-500 truncate">
                  guru.pai@sekolah.sch.id
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}