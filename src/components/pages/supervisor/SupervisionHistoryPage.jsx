import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Badge from '../../common/Badge';
import Loader from '../../common/Loader';
import EmptyState from '../../common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { supervisionService } from '../../services/supervisionService';
import { formatDateID, formatScore, SUPERVISION_STATUS_MAP } from '../../utils/formatters';

export default function SupervisionHistoryPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);

  useEffect(() => {
    if (!profile?.school_id) return;
    supervisionService
      .getSupervisions(profile.school_id)
      .then((data) => setList(data.filter((item) => item.status === 'completed')))
      .finally(() => setLoading(false));
  }, [profile?.school_id]);

  if (loading) return <Loader text="Memuat riwayat supervisi..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-navy-900">Riwayat & Rekap Supervisi</h1>
        <p className="text-sm text-slate-500 mt-0.5">Supervisi yang telah lengkap dan ditandatangani.</p>
      </div>
      <Card bodyClassName="p-0">
        {list.length === 0 ? (
          <EmptyState title="Belum Ada Riwayat Selesai" description="Supervisi yang berstatus selesai akan tampil di sini." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b">
                <tr>
                  <th className="px-6 py-3.5">Guru</th>
                  <th className="px-6 py-3.5">Mata Pelajaran</th>
                  <th className="px-6 py-3.5">Tanggal</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Nilai</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((item) => {
                  const status = SUPERVISION_STATUS_MAP[item.status] || { label: item.status, variant: 'default' };
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 font-semibold">{item.teacher?.full_name}</td>
                      <td className="px-6 py-4">{item.subject?.name}</td>
                      <td className="px-6 py-4">{formatDateID(item.supervision_date)}</td>
                      <td className="px-6 py-4"><Badge variant={status.variant}>{status.label}</Badge></td>
                      <td className="px-6 py-4 text-right font-bold">{formatScore(item.final_score)}</td>
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" onClick={() => navigate(`/supervisor/supervisions/${item.id}`)}>Buka</Button>
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
