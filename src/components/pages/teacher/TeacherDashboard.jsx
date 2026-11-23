import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, CheckCircle2, Clock, Award, FileUp } from 'lucide-react';
import StatCard from '../../dashboard/StatCard';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Badge from '../../common/Badge';
import Loader from '../../common/Loader';
import EmptyState from '../../common/EmptyState';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { formatDateID, formatScore, SUPERVISION_STATUS_MAP } from '../../utils/formatters';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [supervisions, setSupervisions] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadTeacherSupervisions() {
      if (!profile?.teacherRecord?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('supervisions')
          .select(`
            id,
            class_name,
            supervision_date,
            academic_year,
            status,
            final_score,
            category,
            subject:subjects(name),
            supervisor:profiles!supervisions_supervisor_id_fkey(full_name)
          `)
          .eq('teacher_id', profile.teacherRecord.id)
          .order('supervision_date', { ascending: false });

        if (active) setSupervisions(data || []);
      } catch (err) {
        console.error('Error memuat supervisi guru:', err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTeacherSupervisions();
    return () => {
      active = false;
    };
  }, [profile]);

  if (loading) return <Loader text="Memuat data supervisi Anda..." />;

  const completed = supervisions.filter((s) => s.status === 'completed');
  const awaitingSign = supervisions.filter((s) => s.status === 'awaiting_signature');
  const scored = supervisions.filter((s) => s.final_score !== null);
  const avgScore =
    scored.length > 0
      ? scored.reduce((sum, item) => sum + Number(item.final_score), 0) / scored.length
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-navy-900">
          Dashboard Guru
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Selamat datang, <span className="font-semibold text-slate-700">{profile?.full_name}</span>. Unggah perangkat ajar dan pantau hasil supervisi Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Supervisi Saya"
          value={supervisions.length}
          subtitle="Riwayat & jadwal aktif"
          icon={ClipboardList}
          accent="navy"
        />
        <StatCard
          title="Menunggu Tanda Tangan"
          value={awaitingSign.length}
          subtitle="Perlu pengesahan Anda"
          icon={Clock}
          accent="amber"
        />
        <StatCard
          title="Supervisi Selesai"
          value={completed.length}
          subtitle="Laporan siap diunduh"
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatCard
          title="Rata-Rata Nilai"
          value={formatScore(avgScore)}
          subtitle="Capaian evaluasi mengajar"
          icon={Award}
          accent="royal"
        />
      </div>

      <Card
        title="Jadwal & Riwayat Supervisi Anda"
        subtitle="Klik detail untuk mengunggah RPP/foto pembelajaran, melihat catatan supervisor, atau menandatangani laporan"
        bodyClassName="p-0"
      >
        {supervisions.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={FileUp}
              title="Belum Ada Jadwal Supervisi"
              description="Kepala sekolah/supervisor belum menjadwalkan sesi supervisi untuk akun Anda."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Mata Pelajaran & Kelas</th>
                  <th className="px-6 py-3.5 font-semibold">Supervisor</th>
                  <th className="px-6 py-3.5 font-semibold">Tanggal</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Nilai</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supervisions.map((item) => {
                  const statusCfg = SUPERVISION_STATUS_MAP[item.status] || {
                    label: item.status,
                    variant: 'default',
                  };
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-navy-900">
                          {item.subject?.name || '-'}
                        </p>
                        <p className="text-xs text-slate-500">Kelas {item.class_name}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {item.supervisor?.full_name || '-'}
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
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/teacher/supervisions/${item.id}`)}
                        >
                          Detail & Dokumen
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