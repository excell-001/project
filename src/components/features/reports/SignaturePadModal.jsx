import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Check } from 'lucide-react';
import Modal from '../../common/Modal';
import Button from '../../common/Button';

export default function SignaturePadModal({
  isOpen,
  onClose,
  signerName,
  signerNip,
  roleLabel,
  onConfirm,
}) {
  const sigRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleClear = () => {
    sigRef.current?.clear();
    setError('');
  };

  const handleSave = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setError('Silakan bubuhkan tanda tangan Anda pada kotak kanvas di atas.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      // Gunakan getCanvas() standar agar tidak terkendala bug trim-canvas pada Vite
      const canvas = sigRef.current.getCanvas();
      const dataUrl = canvas.toDataURL('image/png');
      await onConfirm(dataUrl);
      onClose();
    } catch (err) {
      setError(err?.message || 'Terjadi kesalahan saat menyimpan tanda tangan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tanda Tangan Digital — ${roleLabel}`}
      subtitle={`${signerName || ''} ${signerNip ? `(NIP. ${signerNip})` : ''}`}
      size="md"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          Gunakan mouse, touchpad, atau layar sentuh untuk membubuhkan tanda tangan pada area di bawah ini. Tanda tangan akan tersemat langsung ke dalam laporan PDF resmi.
        </p>

        <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-white overflow-hidden">
          <SignatureCanvas
            ref={sigRef}
            penColor="#0B2545"
            minWidth={1.5}
            maxWidth={3}
            canvasProps={{
              width: 500,
              height: 190,
              className: 'w-full h-48 cursor-crosshair bg-white block',
            }}
          />
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button variant="secondary" size="sm" icon={Eraser} onClick={handleClear}>
            Ulangi / Bersihkan
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Batal
            </Button>
            <Button
              variant="navy"
              size="sm"
              icon={Check}
              loading={saving}
              onClick={handleSave}
            >
              Sahkan Tanda Tangan
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}