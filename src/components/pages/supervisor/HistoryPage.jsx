import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { History, ArrowRight } from 'lucide-react';
import Card from '../../common/Card';
import Select from '../../common/Select';
import Input from '../../common/Input';
import Button from '../../common/Button';
import Badge from '../../common/Badge';
import Loader from '../../common/Loader';
import EmptyState from '../../common/EmptyState';
import { supervisionService } from '../../services/supervisionService';
import { teacherService } from '../../services/teacherService';
import { useAuth } from '../../hooks/useAuth';
import { formatDateID, formatScore, SUPERVISION_STATUS_MAP } from '../../utils/formatters';

export default function HistoryPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const schoolId = profile?.school_id;

  const [loading, setLoading] = useState(true);
  const [supervisions, setSupervisions] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [teacherFilter, setTeacherFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    if (!schoolId) return;
    Promise.all([
      supervisionService.getSupervisions(schoolId),
      teacherService.getTeachers(schoolId),
    ])
      .then(([supList, teacherList]) => {
        setSupervisions(supList);
        setTeachers(teacherList);
      })
      .finally(() => setLoading(false));
  }, [schoolId]);

  const academicYears = useMemo(() => {
    const years = Array.from(new Set(supervisions.map((s) => s.academic_year))).filter(Boolean);
    return years.map((y) => ({ value: y, label: y }));
  }, [supervisions]);

  const filtered = useMemo(() => {
    return supervisions.filter((item) => {
      if (teacherFilter && item.teacher_id !== teacherFilter) return false;
      if (yearFilter && item.academic_year !== yearFilter) return false;
      if (dateFilter && item.supervision_date !== dateFilter) return false;
      return true;
    });
  }, [supervisions, teacherFilter, yearFilter, dateFilter]);

  const chartData = useMemo(() => {
    return [...filtered]
      .filter((s) => s.final_score !== null)
      .reverse()
      .slice(-10)
      .map((s) => ({
        name: `${s.teacher?.full_name?.split(' ')[0] || 'Guru'} (${s.class_name})`,
        Perencanaan: Number(s.planning_score || 0),
        Pelaksanaan: Number(s.execution_score || 0),
        Evaluasi: Number(s.evaluation_score || 0),
        NilaiAkhir: Number(s.final_score || 0),
      }));
  }, [filtered]);

  if (loading) return <Loader text="Memuat riwayat & analisis supervisi..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-navy-900">
          Riwayat & Perbandingan Hasil Supervisi
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Filter berdasarkan guru, tahun pelajaran, atau tanggal untuk memantau perkembangan mutu pembelajaran.
        </p>
      </div>

      {/* Filter */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <Select
            label="Filter Guru"
            placeholder="Semua Guru"
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            options={teachers.map((t) => ({ value: t.id, label: t.full_name }))}
          />
          <Select
            label="Tahun Pelajaran"
            placeholder="Semua Tahun"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            options={academicYears}
          />
          <Input
            label="Tanggal Spesifik"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          <Button
            variant="secondary"
            onClick={() => {
              setTeacherFilter('');
              setYearFilter('');
              setDateFilter('');
            }}
          >
            Reset Filter
          </Button>
        </div>
      </Card>

      {/* Grafik Perbandingan Komponen */}
      {chartData.length > 0 && (
        <Card
          title="Grafik Perbandingan Nilai Tiga Komponen"
          subtitle="Perbandingan skor Perencanaan, Pelaksanaan, dan Evaluasi pada supervisi yang telah dinilai"
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Perencanaan" fill="#0B2545" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pelaksanaan" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Evaluasi" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Tabel Riwayat */}
      <Card title={`Daftar Riwayat (${filtered.length} Kegiatan)`} bodyClassName="p-0">
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={History}
              title="Tidak Ada Riwayat Sesuai Filter"
              description="Ubah kriteria filter di atas atau buat kegiatan supervisi baru."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Tanggal & TA</th>
                  <th className="px-6 py-3.5 font-semibold">Guru & Mapel</th>
                  <th className="px-6 py-3.5 font-semibold text-center">Perencanaan</th>
                  <th className="px-6 py-3.5 font-semibold text-center">Pelaksanaan</th>
                  <th className="px-6 py-3.5 font-semibold text-center">Evaluasi</th>
                  <th className="px-6 py-3.5 font-semibold text-center">Nilai Akhir</th>
                  <th className="px-6 py-3.5 font-semibold">Status</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Detail</th>
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
                        <p className="font-medium text-slate-800">{formatDateID(item.supervision_date)}</p>
                        <p className="text-xs text-slate-500">{item.academic_year}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-navy-900">{item.teacher?.full_name}</p>
                        <p className="text-xs text-slate-500">
                          {item.subject?.name} · {item.class_name}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">{formatScore(item.planning_score)}</td>
                      <td className="px-6 py-4 text-center">{formatScore(item.execution_score)}</td>
                      <td className="px-6 py-4 text-center">{formatScore(item.evaluation_score)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-navy-900 block">{formatScore(item.final_score)}</span>
                        {item.category && <span className="text-[11px] text-slate-500">{item.category}</span>}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="soft"
                          size="sm"
                          onClick={() => navigate(`/supervisor/supervisions/${item.id}`)}
                        >
                          Buka <ArrowRight className="w-3.5 h-3.5" />
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