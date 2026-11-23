import { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Upload,
  Eye,
  Download,
  Trash2,
} from 'lucide-react';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import Badge from '../../common/Badge';
import { documentService } from '../../services/documentService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatFileSize } from '../../utils/formatters';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export default function DocumentUploader({
  supervisionId,
  documents = [],
  onDocumentsChanged,
}) {
  const { user, isSupervisor } = useAuth();
  const toast = useToast();

  const [uploadingType, setUploadingType] = useState(null);
  const [caption, setCaption] = useState('');
  const [previewItem, setPreviewItem] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const rppDocs = documents.filter((d) => d.doc_type === 'rpp_modul');
  const photoDocs = documents.filter((d) => d.doc_type === 'classroom_photo');

  const handleFileUpload = async (e, docType) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_SIZE_BYTES) {
      toast.error('File Terlalu Besar', 'Maksimal ukuran file adalah 10 MB.');
      return;
    }

    const allowedRpp = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const allowedPhotos = ['image/jpeg', 'image/png', 'image/webp'];

    if (docType === 'rpp_modul' && !allowedRpp.includes(file.type)) {
      toast.error('Format Tidak Didukung', 'Unggah RPP/Modul Ajar dalam format PDF atau DOC/DOCX.');
      return;
    }

    if (docType === 'classroom_photo' && !allowedPhotos.includes(file.type)) {
      toast.error('Format Tidak Didukung', 'Unggah foto pembelajaran dalam format JPG, PNG, atau WEBP.');
      return;
    }

    setUploadingType(docType);
    try {
      await documentService.uploadDocument({
        supervisionId,
        userId: user.id,
        docType,
        file,
        caption: caption.trim(),
      });
      setCaption('');
      toast.success('Berhasil Diunggah', `${file.name} berhasil disimpan.`);
      await onDocumentsChanged?.();
    } catch (err) {
      toast.error('Gagal Mengunggah File', err.message);
    } finally {
      setUploadingType(null);
    }
  };

  const handlePreview = async (doc) => {
    try {
      const signedUrl = await documentService.getSignedUrl(doc.file_path);
      setPreviewItem(doc);
      setPreviewUrl(signedUrl);
    } catch (err) {
      toast.error('Gagal Membuka File', err.message);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const signedUrl = await documentService.getSignedUrl(doc.file_path);
      const a = document.createElement('a');
      a.href = signedUrl;
      a.download = doc.file_name;
      a.target = '_blank';
      a.click();
    } catch (err) {
      toast.error('Gagal Mengunduh', err.message);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Hapus file "${doc.file_name}"?`)) return;
    try {
      await documentService.deleteDocument(doc);
      toast.info('File Dihapus', doc.file_name);
      await onDocumentsChanged?.();
    } catch (err) {
      toast.error('Gagal Menghapus File', err.message);
    }
  };

  const renderDocList = (list, emptyText) => {
    if (list.length === 0) {
      return (
        <p className="text-xs text-slate-400 italic py-4 text-center border border-dashed border-slate-200 rounded-xl">
          {emptyText}
        </p>
      );
    }

    return (
      <div className="space-y-2.5">
        {list.map((doc) => {
          const canDelete = isSupervisor || doc.uploaded_by === user?.id;
          return (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy-900 truncate">
                  {doc.file_name}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span>{formatFileSize(doc.file_size)}</span>
                  {doc.caption && <span>· {doc.caption}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Eye}
                  onClick={() => handlePreview(doc)}
                >
                  Lihat
                </Button>
                <Button
                  variant="soft"
                  size="sm"
                  icon={Download}
                  onClick={() => handleDownload(doc)}
                >
                  Unduh
                </Button>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Keterangan Dokumen / Foto (Opsional sebelum memilih file)
        </label>
        <input
          type="text"
          placeholder="Contoh: Modul Ajar Bab 2 PAI atau Foto Kegiatan Diskusi Kelompok..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:border-royal-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unggah RPP / Modul Ajar */}
        <Card
          title={
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-royal-700" />
              Dokumen RPP / Modul Ajar
            </span>
          }
          subtitle="Format PDF, DOC, atau DOCX (Maks. 10 MB)"
          action={<Badge variant="info">{rppDocs.length} File</Badge>}
        >
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-royal-200 rounded-2xl bg-royal-50/40 hover:bg-royal-50 cursor-pointer transition-colors">
              <Upload className="w-6 h-6 text-royal-700 mb-1.5" />
              <span className="text-xs font-bold text-navy-900">
                {uploadingType === 'rpp_modul'
                  ? 'Mengunggah RPP/Modul Ajar...'
                  : 'Klik untuk Unggah RPP / Modul Ajar'}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">PDF, DOC, DOCX</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                disabled={uploadingType !== null}
                onChange={(e) => handleFileUpload(e, 'rpp_modul')}
                className="hidden"
              />
            </label>

            {renderDocList(rppDocs, 'Belum ada dokumen RPP / Modul Ajar yang diunggah.')}
          </div>
        </Card>

        {/* Unggah Foto Pembelajaran */}
        <Card
          title={
            <span className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-700" />
              Foto Dokumentasi Pembelajaran
            </span>
          }
          subtitle="Foto guru saat melaksanakan pembelajaran di kelas (JPG, PNG, WEBP)"
          action={<Badge variant="success">{photoDocs.length} Foto</Badge>}
        >
          <div className="space-y-4">
            <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-emerald-200 rounded-2xl bg-emerald-50/40 hover:bg-emerald-50 cursor-pointer transition-colors">
              <Upload className="w-6 h-6 text-emerald-700 mb-1.5" />
              <span className="text-xs font-bold text-navy-900">
                {uploadingType === 'classroom_photo'
                  ? 'Mengunggah Foto Pembelajaran...'
                  : 'Klik untuk Unggah Foto Pembelajaran'}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">JPG, PNG, WEBP (Maks. 10 MB)</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploadingType !== null}
                onChange={(e) => handleFileUpload(e, 'classroom_photo')}
                className="hidden"
              />
            </label>

            {renderDocList(photoDocs, 'Belum ada foto dokumentasi pembelajaran di kelas.')}
          </div>
        </Card>
      </div>

      {/* Modal Preview File / Gambar */}
      <Modal
        isOpen={!!previewItem}
        onClose={() => {
          setPreviewItem(null);
          setPreviewUrl('');
        }}
        title={previewItem?.file_name || 'Pratinjau Dokumen'}
        subtitle={previewItem?.caption || ''}
        size="lg"
      >
        {previewItem?.mime_type?.startsWith('image/') ? (
          <img
            src={previewUrl}
            alt={previewItem.file_name}
            className="max-h-[65vh] mx-auto rounded-xl object-contain"
          />
        ) : previewItem?.mime_type === 'application/pdf' ? (
          <iframe
            src={previewUrl}
            title={previewItem.file_name}
            className="w-full h-[65vh] rounded-xl border border-slate-200"
          />
        ) : (
          <div className="text-center py-8 space-y-3">
            <p className="text-sm text-slate-600">
              Pratinjau langsung tidak tersedia untuk format Word (.doc/.docx). Silakan unduh file untuk membukanya.
            </p>
            <Button
              variant="primary"
              icon={Download}
              onClick={() => handleDownload(previewItem)}
            >
              Unduh Dokumen
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}