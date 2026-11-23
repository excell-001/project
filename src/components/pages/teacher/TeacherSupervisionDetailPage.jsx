import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FolderUp, FileSpreadsheet, ClipboardList } from 'lucide-react';
import Button from '../../common/Button';
import Badge from '../../common/Badge';
import Loader from '../../common/Loader';
import DocumentUploader from '../../features/documentation/DocumentUploader';
import AssessmentForm from '../../features/assessment/AssessmentForm';
import RecapAndReportTab from '../../features/reports/RecapAndReportTab';
import { supervisionService } from '../../services/supervisionService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatDateID, SUPERVISION_STATUS_MAP } from '../../utils/formatters';

const TEACHER_TABS = [
  { key: 'documents', label: '1. Unggah RPP & Foto Kelas', icon: FolderUp },
  { key: 'recap', label: '2. Hasil, TTD Digital & PDF', icon: FileSpreadsheet },
  { key: 'rubric', label: '3. Rincian Skor Instrumen', icon: ClipboardList },
];

export default function TeacherSupervisionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('documents');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const loadDetail = useCallback(async () => {
    try {
      const detail = await supervisionService.getSupervisionDetail(id);
      setData(detail);
    } catch (err) {
      toast.error('Gagal Memuat Detail', err.message);
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    let active = true;

    async function loadInitialDetail() {
      try {
        const detail = await supervisionService.getSupervisionDetail(id);
        if (active) setData(detail);
      } catch (err) {
        if (active) toast.error('Gagal Memuat Detail', err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitialDetail();
    return () => {
      active = false;
    };
  }, [id, toast]);

  const handleSaveSignature = async (sigPayload) => {
    try {
      await supervisionService.saveSignature(sigPayload);
      toast.success('Pengesahan Berhasil', 'Tanda tangan digital Anda telah disimpan.');
      await loadDetail();
    } catch (err) {
      toast.error('Gagal Menyimpan Tanda Tangan', err.message);
    }
  };

  if (loading) return <Loader text="Memuat detail supervisi..." />;
  if (!data?.supervision) return null;

  const { supervision, items, scores, recommendation, documents, signatures } = data;
  const statusCfg = SUPERVISION_STATUS_MAP[supervision.status] || {
    label: supervision.status,
    variant: 'default',
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
        <div className="flex items-start gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate('/teacher/dashboard')}
          >
            Kembali
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-extrabold text-navy-900">
                Supervisi {supervision.subject?.name} — Kelas {supervision.class_name}
              </h1>
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Supervisor: <strong>{supervision.supervisor?.full_name}</strong> · Tanggal:{' '}
              {formatDateID(supervision.supervision_date)} · TA {supervision.academic_year}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-100">
          {TEACHER_TABS.map((tab) => {
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

      {activeTab === 'documents' && (
        <DocumentUploader
          supervisionId={id}
          documents={documents}
          onDocumentsChanged={loadDetail}
        />
      )}

      {activeTab === 'recap' && (
        <RecapAndReportTab
          supervision={supervision}
          items={items}
          scores={scores}
          recommendation={recommendation}
          documents={documents}
          signatures={signatures}
          currentRole="teacher"
          currentUserProfile={profile}
          onSaveSignature={handleSaveSignature}
        />
      )}

      {activeTab === 'rubric' && (
        <AssessmentForm
          supervisionId={id}
          items={items}
          initialScores={scores}
          scoreConfig={supervision.school?.score_config}
          readOnly
        />
      )}
    </div>
  );
}