import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  Award,
  Plus,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import StatCard from '../../dashboard/StatCard';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Badge from '../../common/Badge';
import Loader from '../../common/Loader';
import EmptyState from '../../common/EmptyState';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { formatDateID, formatScore, SUPERVISION_STATUS_MAP } from '../../utils/formatters';

export default function SupervisorDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalSupervisions: 0,
    completedSupervisions: 0,
    pendingSupervisions: 0,
    averageScore: null,
  });
  const [recentSupervisions, setRecentSupervisions] = useState([]);

  useEffect(() => {
    let active = true;
    const schoolId = profile?.school_id;

    async function fetchDashboardData() {
      if (!schoolId) {
        if (active) setLoading(false);
        return;
      }
      try {
        const [{ count: teacherCount }, { data: supervisions }] = await Promise.all([
          supabase
            .from('teachers')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', schoolId)
            .eq('is_active', true),
          supabase
            .from('supervisions')
            .select(`
              id,
              class_name,
              supervision_date,
              academic_year,
              status,
              final_score,
              category,
              teacher:teachers(full_name, nip),
              subject:subjects(name)
            `)
            .eq('school_id', schoolId)
            .order('supervision_date', { ascending: false }),
        ]);

        if (!active) return;

        const list = supervisions || [];
        const completed = list.filter((s) => s.status === 'completed');
        const pending = list.filter((s) => s.status !== 'completed');
        const scored = list.filter((s) => s.final_score !== null);
        const avg =
          scored.length > 0
            ? scored.reduce((acc, cur) => acc + Number(cur.final_score), 0) / scored.length
            : null;

        setStats({
          totalTeachers: teacherCount || 0,
          totalSupervisions: list.length,
          completedSupervisions: completed.length,
          pendingSupervisions: pending.length,
          averageScore: avg,
        });
        setRecentSupervisions(list.slice(0, 6));
      } catch (err) {
        console.error('Error memuat dashboard:', err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchDashboardData();
    return () => {
      active = false;
    };
  }, [profile?.school_id]);

  if (loading) return <Loader text="Memuat ringkasan supervisi..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">
            Dashboard Supervisi Pendidikan
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Selamat datang, <span className="font-semibold text-slate-700">{profile?.full_name}</span>. Pantau progres pembinaan guru secara real-time.
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => navigate('/supervisor/supervisions/new')}
        >
          Buat Jadwal Supervisi
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Guru Aktif"
          value={stats.totalTeachers}
          subtitle="Terdaftar di sekolah"
          icon={Users}
          accent="navy"
        />
        <StatCard
          title="Total Supervisi"
          value={stats.totalSupervisions}
          subtitle="Seluruh sesi tercatat"
          icon={ClipboardCheck}
          accent="royal"
        />
        <StatCard
          title="Supervisi Selesai"
          value={stats.completedSupervisions}
          subtitle="Terverifikasi & TTD lengkap"
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatCard
          title="Dalam Proses"
          value={stats.pendingSupervisions}
          subtitle="Jadwal / penilaian / TTD"
          icon={Clock}
          accent="amber"
        />
        <StatCard
          title="Rata-Rata Nilai"
          value={formatScore(stats.averageScore)}
          subtitle="Skala penilaian 0–100"
          icon={Award}
          accent="indigo"
        />
      </div>

      {/* Daftar Supervisi Terbaru */}
      <Card
        title="Kegiatan Supervisi Terbaru"
        subtitle="Daftar jadwal dan hasil penilaian supervisi terkini"
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/supervisor/supervisions')}
          >
            Lihat Semua <ArrowRight className="w-4 h-4" />
          </Button>
        }
        bodyClassName="p-0"
      >
        {recentSupervisions.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Calendar}
              title="Belum Ada Kegiatan Supervisi"
              description="Mulai dengan menambahkan data guru terlebih dahulu, lalu buat jadwal supervisi akademik pertama."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => navigate('/supervisor/supervisions/new')}
                >
                  Tambah Supervisi
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Guru & Mapel</th>
                  <th className="px-6 py-3.5 font-semibold">Kelas</th>
                  <th className="px-6 py-3.5 font-semibold">Tanggal</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Nilai Akhir</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSupervisions.map((item) => {
                  const statusCfg = SUPERVISION_STATUS_MAP[item.status] || {
                    label: item.status,
                    variant: 'default',
                  };
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-navy-900">
                          {item.teacher?.full_name || '-'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.subject?.name || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {item.class_name}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatDateID(item.supervision_date)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-navy-900">
                        {formatScore(item.final_score)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="soft"
                          size="sm"
                          onClick={() => navigate(`/supervisor/supervisions/${item.id}`)}
                        >
                          Buka
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}