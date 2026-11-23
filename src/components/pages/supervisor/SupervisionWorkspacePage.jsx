import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardCheck,
  FolderOpen,
  MessageSquarePlus,
  FileSpreadsheet,
  Save,
} from 'lucide-react';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Badge from '../../common/Badge';
import Input from '../../common/Input';
import Loader from '../../common/Loader';
import AssessmentForm from '../../features/assessment/AssessmentForm';
import DocumentUploader from '../../features/documentation/DocumentUploader';
import RecapAndReportTab from '../../features/reports/RecapAndReportTab';
import { supervisionService } from '../../services/supervisionService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatDateID, SUPERVISION_STATUS_MAP } from '../../utils/formatters';

const TABS = [
  { key: 'assessment', label: '1. Instrumen Penilaian (18)', icon: ClipboardCheck },
  { key: 'documents', label: '2. Dokumentasi RPP & Foto', icon: FolderOpen },
  { key: 'recommendation', label: '3. Catatan & Rekomendasi', icon: MessageSquarePlus },
  { key: 'recap', label: '4. Rekapitulasi, TTD & PDF', icon: FileSpreadsheet },
];

export default function SupervisionWorkspacePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('assessment');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [recForm, setRecForm] = useState({
    supervisor_notes: '',
    principal_recommendation: '',
    follow_up_plan: '',
    target_date: '',
  });
  const [savingRec, setSavingRec] = useState(false);

  const loadWorkspace = useCallback(async () => {
    try {
      const detail = await supervisionService.getSupervisionDetail(id);
      setData(detail);
      setRecForm({
        supervisor_notes: detail.recommendation?.supervisor_notes || '',
        principal_recommendation: detail.recommendation?.principal_recommendation || '',
        follow_up_plan: detail.recommendation?.follow_up_plan || '',
        target_date: detail.recommendation?.target_date || '',
      });
    } catch (err) {
      toast.error('Gagal Memuat Supervisi', err.message);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    let active = true;

    async function loadInitialWorkspace() {
      try {
        const detail = await supervisionService.getSupervisionDetail(id);
        if (!active) return;
        setData(detail);
        setRecForm({
          supervisor_notes: detail.recommendation?.supervisor_notes || '',
          principal_recommendation: detail.recommendation?.principal_recommendation || '',
          follow_up_plan: detail.recommendation?.follow_up_plan || '',
          target_date: detail.recommendation?.target_date || '',
        });
      } catch (err) {
        if (active) toast.error('Gagal Memuat Supervisi', err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitialWorkspace();
    return () => {
      active = false;
    };
  }, [id, toast]);

  const handleSaveScores = async (entries, summary) => {
    try {
      await supervisionService.saveAssessmentScores(id, entries, summary);
      toast.success(
        'Penilaian Tersimpan',
        summary.allCompleted
          ? `Nilai Akhir: ${summary.finalScore} (${summary.category})`
          : `Progres tersimpan (${summary.totalFilled}/18 indikator).`
      );
      await loadWorkspace();
    } catch (err) {
      toast.error('Gagal Menyimpan Skor', err.message);
    }
  };

  const handleSaveRecommendation = async (e) => {
    e.preventDefault();
    setSavingRec(true);
    try {
      await supervisionService.saveRecommendation(id, {
        supervisor_notes: recForm.supervisor_notes.trim() || null,
        principal_recommendation: recForm.principal_recommendation.trim() || null,
        follow_up_plan: recForm.follow_up_plan.trim() || null,
        target_date: recForm.target_date || null,
      });
      toast.success('Rekomendasi Tersimpan', 'Catatan dan rencana tindak lanjut diperbarui.');
      await loadWorkspace();
    } catch (err) {
      toast.error('Gagal Menyimpan Rekomendasi', err.message);
    } finally {
      setSavingRec(false);
    }
  };

  const handleSaveSignature = async (sigPayload) => {
    try {
      await supervisionService.saveSignature(sigPayload);
      toast.success('Tanda Tangan Disahkan', 'Tanda tangan supervisor telah disimpan.');
      await loadWorkspace();
    } catch (err) {
      toast.error('Gagal Menyimpan Tanda Tangan', err.message);
    }
  };

  if (loading) return <Loader text="Membuka lembar kerja supervisi..." />;
  if (!data?.supervision) return null;

  const { supervision, items, scores, recommendation, documents, signatures } = data;
  const statusCfg = SUPERVISION_STATUS_MAP[supervision.status] || {
    label: supervision.status,
    variant: 'default',
  };

  return (
    <div className="space-y-6">
      {/* Header Identitas Supervisi */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/supervisor/supervisions')}
            >
              Daftar
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl font-extrabold text-navy-900">
                  {supervision.teacher?.full_name}
                </h1>
                <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {supervision.subject?.name} · Kelas <strong>{supervision.class_name}</strong> ·{' '}
                {formatDateID(supervision.supervision_date)} · TA {supervision.academic_year} ({supervision.semester})
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-100">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-navy-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'assessment' && (
        <AssessmentForm
          supervisionId={id}
          items={items}
          initialScores={scores}
          scoreConfig={supervision.school?.score_config}
          onSave={handleSaveScores}
        />
      )}

      {activeTab === 'documents' && (
        <DocumentUploader
          supervisionId={id}
          documents={documents}
          onDocumentsChanged={loadWorkspace}
        />
      )}

      {activeTab === 'recommendation' && (
        <Card
          title="Catatan Supervisor, Rekomendasi Kepala Sekolah & Tindak Lanjut"
          subtitle="Berikan umpan balik pembinaan yang konstruktif berdasarkan hasil observasi pembelajaran"
        >
          <form onSubmit={handleSaveRecommendation} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Catatan Hasil Observasi Supervisor
              </label>
              <textarea
                rows={3}
                placeholder="Tuliskan kekuatan dan hal-hal yang perlu ditingkatkan selama proses pembelajaran..."
                value={recForm.supervisor_notes}
                onChange={(e) => setRecForm({ ...recForm, supervisor_notes: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-royal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Rekomendasi Kepala Sekolah
              </label>
              <textarea
                rows={3}
                placeholder="Tuliskan rekomendasi pembinaan profesional untuk guru..."
                value={recForm.principal_recommendation}
                onChange={(e) =>
                  setRecForm({ ...recForm, principal_recommendation: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-royal-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Rencana Tindak Lanjut
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Pendampingan penyusunan rubrik asesmen formatif dan supervisi lanjutan..."
                  value={recForm.follow_up_plan}
                  onChange={(e) => setRecForm({ ...recForm, follow_up_plan: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-royal-600"
                />
              </div>
              <Input
                label="Target Waktu Tindak Lanjut"
                type="date"
                value={recForm.target_date}
                onChange={(e) => setRecForm({ ...recForm, target_date: e.target.value })}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" icon={Save} loading={savingRec}>
                Simpan Catatan & Rekomendasi
              </Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'recap' && (
        <RecapAndReportTab
          supervision={supervision}
          items={items}
          scores={scores}
          recommendation={recommendation}
          documents={documents}
          signatures={signatures}
          currentRole="supervisor"
          currentUserProfile={profile}
          onSaveSignature={handleSaveSignature}
        />
      )}
    </div>
  );
}