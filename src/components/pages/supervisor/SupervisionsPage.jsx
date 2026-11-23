import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ClipboardCheck, ArrowRight } from 'lucide-react';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Badge from '../../common/Badge';
import Loader from '../../common/Loader';
import EmptyState from '../../common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { supervisionService } from '../../services/supervisionService';
import { formatDateID, formatScore, SUPERVISION_STATUS_MAP } from '../../utils/formatters';

export default function SupervisionsPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!profile?.school_id) return;
    supervisionService
      .getSupervisions(profile.school_id)
      .then(setList)
      .catch((err) => toast.error('Gagal Memuat Supervisi', err.message))
      .finally(() => setLoading(false));
  }, [profile?.school_id, toast]);

  const filtered = list.filter((item) =>
    statusFilter === 'all' ? true : item.status === statusFilter
  );

  if (loading) return <Loader text="Memuat daftar kegiatan supervisi..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">
            Kegiatan Supervisi Akademik
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola jadwal observasi kelas, pengisian instrumen, dokumentasi, dan laporan PDF.
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: `Semua (${list.length})` },
          { key: 'scheduled', label: 'Dijadwalkan' },
          { key: 'in_progress', label: 'Sedang Dinilai' },
          { key: 'awaiting_signature', label: 'Menunggu TTD Guru' },
          { key: 'completed', label: 'Selesai' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === tab.key
                ? 'bg-navy-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card bodyClassName="p-0">
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={ClipboardCheck}
              title="Belum Ada Data Supervisi"
              description="Buat jadwal supervisi baru untuk mulai menilai perangkat dan pelaksanaan pembelajaran guru."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => navigate('/supervisor/supervisions/new')}
                >
                  Buat Jadwal Baru
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Guru & Mata Pelajaran</th>
                  <th className="px-6 py-3.5 font-semibold">Kelas / Tahun</th>
                  <th className="px-6 py-3.5 font-semibold">Tanggal</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Nilai Akhir</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Workspace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const st = SUPERVISION_STATUS_MAP[item.status] || {
                    label: item.status,
                    variant: 'default',
                  };
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-navy-900">
                          {item.teacher?.full_name}
                        </p>
                        <p className="text-xs text-slate-500">{item.subject?.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">{item.class_name}</p>
                        <p className="text-xs text-slate-500">
                          {item.academic_year} ({item.semester})
                        </p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatDateID(item.supervision_date)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-navy-900 block">
                          {formatScore(item.final_score)}
                        </span>
                        {item.category && (
                          <span className="text-[11px] text-slate-500">{item.category}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/supervisor/supervisions/${item.id}`)}
                        >
                          Kelola <ArrowRight className="w-3.5 h-3.5" />
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