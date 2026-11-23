import { useRef, useState } from 'react';
import {
  FileDown,
  PenTool,
  CheckCircle2,
  AlertTriangle,
  Award,
} from 'lucide-react';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Badge from '../../common/Badge';
import SignaturePadModal from './SignaturePadModal';
import PdfReportTemplate from './PdfReportTemplate';
import { exportElementToPdfA4 } from '../../utils/pdfGenerator';
import { formatDateID, formatScore } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';

export default function RecapAndReportTab({
  supervision,
  items = [],
  scores = [],
  recommendation,
  documents = [],
  signatures = [],
  currentRole, // 'supervisor' | 'teacher'
  currentUserProfile,
  onSaveSignature,
}) {
  const toast = useToast();
  const pdfRef = useRef(null);
  const [sigModalOpen, setSigModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const supervisorSig = signatures.find((s) => s.signer_role === 'supervisor');
  const teacherSig = signatures.find((s) => s.signer_role === 'teacher');
  const mySignature = currentRole === 'supervisor' ? supervisorSig : teacherSig;

  const isScoreComplete = supervision?.final_score !== null && supervision?.final_score !== undefined;

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const safeTeacher = (supervision.teacher?.full_name || 'Guru').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Laporan_Supervisi_${safeTeacher}_${supervision.supervision_date}.pdf`;
      await exportElementToPdfA4(pdfRef.current, fileName);
      toast.success('PDF Berhasil Diunduh', fileName);
    } catch (err) {
      toast.error('Gagal Membuat PDF', err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleConfirmSignature = async (dataUrl) => {
    await onSaveSignature({
      supervision_id: supervision.id,
      signer_id: currentUserProfile.id,
      signer_role: currentRole,
      signer_name: currentUserProfile.full_name,
      signer_nip: currentUserProfile.nip || currentUserProfile.teacherRecord?.nip || null,
      signature_data_url: dataUrl,
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner Status Kelengkapan Nilai */}
      {!isScoreComplete && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">Penilaian Instrumen Belum Lengkap (18 Indikator)</p>
            <p className="mt-0.5 text-amber-800">
              Nilai Akhir dan Kategori belum dapat ditampilkan sebelum seluruh 18 indikator pada komponen Perencanaan, Pelaksanaan, dan Evaluasi diisi oleh Supervisor.
            </p>
          </div>
        </div>
      )}

      {/* Ringkasan Nilai */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
          <p className="text-xs font-semibold text-slate-500">1. Perencanaan</p>
          <p className="font-display text-2xl font-extrabold text-navy-900 mt-1">
            {formatScore(supervision.planning_score)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Skala 0–100 (6 indikator)</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
          <p className="text-xs font-semibold text-slate-500">2. Pelaksanaan</p>
          <p className="font-display text-2xl font-extrabold text-navy-900 mt-1">
            {formatScore(supervision.execution_score)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Skala 0–100 (6 indikator)</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
          <p className="text-xs font-semibold text-slate-500">3. Evaluasi</p>
          <p className="font-display text-2xl font-extrabold text-navy-900 mt-1">
            {formatScore(supervision.evaluation_score)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Skala 0–100 (6 indikator)</p>
        </div>
        <div className="bg-gradient-to-br from-navy-900 to-royal-800 text-white rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-blue-200">Nilai Akhir</p>
            <Award className="w-5 h-5 text-blue-300" />
          </div>
          <p className="font-display text-3xl font-extrabold mt-1">
            {formatScore(supervision.final_score)}
          </p>
          <p className="text-xs font-semibold text-blue-200 mt-1">
            {supervision.category || 'Menunggu kelengkapan'}
          </p>
        </div>
      </div>

      {/* Ringkasan Catatan & Rekomendasi */}
      <Card title="Catatan & Rekomendasi Pembinaan">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs font-bold text-navy-900 uppercase mb-1.5">Catatan Supervisor</p>
            <p className="text-slate-700 whitespace-pre-line">
              {recommendation?.supervisor_notes || 'Belum ada catatan.'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs font-bold text-navy-900 uppercase mb-1.5">Rekomendasi Kepala Sekolah</p>
            <p className="text-slate-700 whitespace-pre-line">
              {recommendation?.principal_recommendation || 'Belum ada rekomendasi.'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-xs font-bold text-navy-900 uppercase mb-1.5">Rencana Tindak Lanjut</p>
            <p className="text-slate-700 whitespace-pre-line">
              {recommendation?.follow_up_plan || 'Belum ada rencana tindak lanjut.'}
            </p>
            {recommendation?.target_date && (
              <p className="text-xs text-royal-700 font-semibold mt-2">
                Target: {formatDateID(recommendation.target_date)}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Pengesahan Tanda Tangan Digital & Ekspor PDF */}
      <Card
        title="Pengesahan Tanda Tangan Digital & Laporan PDF"
        subtitle="Kedua belah pihak membubuhkan tanda tangan digital sebelum atau saat mengunduh laporan A4"
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="soft"
              size="sm"
              icon={PenTool}
              disabled={!isScoreComplete}
              onClick={() => setSigModalOpen(true)}
            >
              {mySignature ? 'Perbarui Tanda Tangan Saya' : 'Tanda Tangani Laporan'}
            </Button>
            <Button
              variant="navy"
              size="sm"
              icon={FileDown}
              loading={exporting}
              onClick={handleExportPdf}
            >
              Unduh Laporan PDF (A4)
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Kolom Supervisor */}
          <div className="p-5 rounded-2xl border border-slate-200 text-center space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Pihak Pertama</span>
              {supervisorSig ? (
                <Badge variant="success">
                  <CheckCircle2 className="w-3 h-3" /> Sudah TTD
                </Badge>
              ) : (
                <Badge variant="warning">Belum TTD</Badge>
              )}
            </div>
            <p className="text-sm font-bold text-navy-900">Kepala Sekolah / Supervisor</p>
            <div className="h-24 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 my-2">
              {supervisorSig?.signature_data_url ? (
                <img
                  src={supervisorSig.signature_data_url}
                  alt="TTD Supervisor"
                  className="max-h-20 object-contain"
                />
              ) : (
                <span className="text-xs text-slate-400">Menunggu tanda tangan digital</span>
              )}
            </div>
            <p className="text-sm font-bold text-navy-900 underline">
              {supervision.supervisor?.full_name}
            </p>
            <p className="text-xs text-slate-500">NIP. {supervision.supervisor?.nip || '-'}</p>
          </div>

          {/* Kolom Guru */}
          <div className="p-5 rounded-2xl border border-slate-200 text-center space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Pihak Kedua</span>
              {teacherSig ? (
                <Badge variant="success">
                  <CheckCircle2 className="w-3 h-3" /> Sudah TTD
                </Badge>
              ) : (
                <Badge variant="warning">Belum TTD</Badge>
              )}
            </div>
            <p className="text-sm font-bold text-navy-900">Guru yang Disupervisi</p>
            <div className="h-24 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 my-2">
              {teacherSig?.signature_data_url ? (
                <img
                  src={teacherSig.signature_data_url}
                  alt="TTD Guru"
                  className="max-h-20 object-contain"
                />
              ) : (
                <span className="text-xs text-slate-400">Menunggu tanda tangan digital</span>
              )}
            </div>
            <p className="text-sm font-bold text-navy-900 underline">
              {supervision.teacher?.full_name}
            </p>
            <p className="text-xs text-slate-500">NIP. {supervision.teacher?.nip || '-'}</p>
          </div>
        </div>
      </Card>

      {/* Hidden A4 Render Container untuk jsPDF */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
        <PdfReportTemplate
          ref={pdfRef}
          supervision={supervision}
          items={items}
          scores={scores}
          recommendation={recommendation}
          documents={documents}
          signatures={signatures}
        />
      </div>

      {/* Modal Kanvas TTD Digital */}
      <SignaturePadModal
        isOpen={sigModalOpen}
        onClose={() => setSigModalOpen(false)}
        signerName={currentUserProfile?.full_name}
        signerNip={currentUserProfile?.nip || currentUserProfile?.teacherRecord?.nip}
        roleLabel={currentRole === 'supervisor' ? 'Kepala Sekolah / Supervisor' : 'Guru'}
        onConfirm={handleConfirmSignature}
      />
    </div>
  );
}