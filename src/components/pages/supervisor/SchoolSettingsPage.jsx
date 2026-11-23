import { useEffect, useState } from 'react';
import { Save, Plus } from 'lucide-react';
import Card from '../../common/Card';
import Input from '../../common/Input';
import Button from '../../common/Button';
import Loader from '../../common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { schoolService } from '../../services/schoolService';
import { DEFAULT_SCORE_CONFIG } from '../../utils/scoreCalculator';

export default function SchoolSettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const toast = useToast();
  const schoolId = profile?.school_id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    npsn: '',
    address: '',
    district: '',
    city: '',
    province: '',
    principal_name: '',
    principal_nip: '',
    academic_year_default: '2026/2027',
  });
  const [scoreConfig, setScoreConfig] = useState(DEFAULT_SCORE_CONFIG);
  const [subjects, setSubjects] = useState([]);
  const [newSubject, setNewSubject] = useState({ code: '', name: '' });

  useEffect(() => {
    if (!schoolId) return;
    Promise.all([
      schoolService.getSchoolById(schoolId),
      schoolService.getSubjects(schoolId),
    ])
      .then(([school, subjectList]) => {
        setForm({
          name: school.name || '',
          npsn: school.npsn || '',
          address: school.address || '',
          district: school.district || '',
          city: school.city || '',
          province: school.province || '',
          principal_name: school.principal_name || '',
          principal_nip: school.principal_nip || '',
          academic_year_default: school.academic_year_default || '2026/2027',
        });
        setScoreConfig({ ...DEFAULT_SCORE_CONFIG, ...(school.score_config || {}) });
        setSubjects(subjectList);
      })
      .catch((err) => toast.error('Gagal Memuat Sekolah', err.message))
      .finally(() => setLoading(false));
  }, [schoolId, toast]);

  const handleSaveSchool = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await schoolService.updateSchool(schoolId, {
        ...form,
        score_config: scoreConfig,
      });
      await refreshProfile();
      toast.success('Tersimpan', 'Identitas sekolah dan konfigurasi penilaian diperbarui.');
    } catch (err) {
      toast.error('Gagal Menyimpan', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.name.trim()) return;
    try {
      const created = await schoolService.createSubject(schoolId, {
        code: newSubject.code.trim().toUpperCase(),
        name: newSubject.name.trim(),
      });
      setSubjects((prev) => [...prev, created]);
      setNewSubject({ code: '', name: '' });
      toast.success('Mata Pelajaran Ditambahkan', created.name);
    } catch (err) {
      toast.error('Gagal Menambah Mapel', err.message);
    }
  };

  if (loading) return <Loader text="Memuat profil satuan pendidikan..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-navy-900">
          Identitas Sekolah & Konfigurasi Penilaian
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Data ini akan muncul secara otomatis pada setiap kop dokumen supervisi dan laporan PDF.
        </p>
      </div>

      <form onSubmit={handleSaveSchool} className="space-y-6">
        <Card title="Profil Satuan Pendidikan" subtitle="Informasi resmi sekolah dan kepala sekolah">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Sekolah"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="NPSN"
              value={form.npsn}
              onChange={(e) => setForm({ ...form, npsn: e.target.value })}
            />
            <Input
              label="Nama Kepala Sekolah / Supervisor"
              required
              value={form.principal_name}
              onChange={(e) => setForm({ ...form, principal_name: e.target.value })}
            />
            <Input
              label="NIP Kepala Sekolah"
              value={form.principal_nip}
              onChange={(e) => setForm({ ...form, principal_nip: e.target.value })}
            />
            <Input
              label="Tahun Pelajaran Aktif"
              required
              value={form.academic_year_default}
              onChange={(e) => setForm({ ...form, academic_year_default: e.target.value })}
            />
            <Input
              label="Alamat Jalan"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <Input
              label="Kecamatan"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
            <Input
              label="Kabupaten / Kota"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <Input
              label="Provinsi"
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
            />
          </div>
        </Card>

        <Card
          title="Konfigurasi Bobot & Kategori Nilai Akhir"
          subtitle="Sesuaikan pembobotan komponen Perencanaan, Pelaksanaan, dan Evaluasi sesuai kebijakan sekolah"
        >
          <div className="space-y-4">
            <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={scoreConfig.useEqualWeights}
                onChange={(e) =>
                  setScoreConfig({ ...scoreConfig, useEqualWeights: e.target.checked })
                }
                className="w-4 h-4 rounded text-royal-700"
              />
              Gunakan rata-rata seimbang ketiga komponen: (Perencanaan + Pelaksanaan + Evaluasi) / 3
            </label>

            {!scoreConfig.useEqualWeights && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <Input
                  label="Bobot Perencanaan (%)"
                  type="number"
                  value={scoreConfig.weights?.planning ?? 30}
                  onChange={(e) =>
                    setScoreConfig({
                      ...scoreConfig,
                      weights: { ...scoreConfig.weights, planning: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  label="Bobot Pelaksanaan (%)"
                  type="number"
                  value={scoreConfig.weights?.execution ?? 40}
                  onChange={(e) =>
                    setScoreConfig({
                      ...scoreConfig,
                      weights: { ...scoreConfig.weights, execution: Number(e.target.value) },
                    })
                  }
                />
                <Input
                  label="Bobot Evaluasi (%)"
                  type="number"
                  value={scoreConfig.weights?.evaluation ?? 30}
                  onChange={(e) =>
                    setScoreConfig({
                      ...scoreConfig,
                      weights: { ...scoreConfig.weights, evaluation: Number(e.target.value) },
                    })
                  }
                />
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="navy" icon={Save} loading={saving}>
                Simpan Perubahan Sekolah
              </Button>
            </div>
          </div>
        </Card>
      </form>

      <Card title="Daftar Mata Pelajaran" subtitle="Kelola mata pelajaran yang tersedia saat penjadwalan supervisi">
        <form onSubmit={handleAddSubject} className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="sm:w-36">
            <Input
              placeholder="Kode (mis. PAI)"
              value={newSubject.code}
              onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
            />
          </div>
          <div className="flex-1">
            <Input
              placeholder="Nama Mata Pelajaran..."
              value={newSubject.name}
              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
            />
          </div>
          <Button type="submit" variant="primary" icon={Plus}>
            Tambah Mapel
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {subjects.map((sub) => (
            <span
              key={sub.id}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-navy-900"
            >
              {sub.code && (
                <span className="px-1.5 py-0.5 rounded bg-royal-100 text-royal-800 font-bold">
                  {sub.code}
                </span>
              )}
              {sub.name}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}