import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarPlus } from 'lucide-react';
import Card from '../../common/Card';
import Input from '../../common/Input';
import Select from '../../common/Select';
import Button from '../../common/Button';
import Loader from '../../common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { teacherService } from '../../services/teacherService';
import { schoolService } from '../../services/schoolService';
import { supervisionService } from '../../services/supervisionService';

export default function SupervisionCreatePage() {
  const { profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const schoolId = profile?.school_id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [form, setForm] = useState({
    teacher_id: '',
    subject_id: '',
    class_name: '',
    supervision_date: new Date().toISOString().split('T')[0],
    academic_year: profile?.school?.academic_year_default || '2026/2027',
    semester: 'Ganjil',
  });

  useEffect(() => {
    if (!schoolId) return;
    Promise.all([
      teacherService.getTeachers(schoolId),
      schoolService.getSubjects(schoolId),
    ])
      .then(([teacherList, subjectList]) => {
        setTeachers(teacherList.filter((t) => t.is_active));
        setSubjects(subjectList);
      })
      .catch((err) => toast.error('Gagal Memuat Master Data', err.message))
      .finally(() => setLoading(false));
  }, [schoolId, toast]);

  const handleTeacherChange = (teacherId) => {
    const selected = teachers.find((t) => t.id === teacherId);
    setForm((prev) => ({
      ...prev,
      teacher_id: teacherId,
      subject_id: selected?.subject_id || prev.subject_id,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await supervisionService.createSupervision({
        school_id: schoolId,
        supervisor_id: profile.id,
        teacher_id: form.teacher_id,
        subject_id: form.subject_id,
        class_name: form.class_name.trim(),
        supervision_date: form.supervision_date,
        academic_year: form.academic_year.trim(),
        semester: form.semester,
        status: 'scheduled',
      });

      toast.success(
        'Identitas Supervisi Dibuat',
        'Anda sekarang dapat mengisi instrumen penilaian dan dokumentasi.'
      );
      navigate(`/supervisor/supervisions/${created.id}`);
    } catch (err) {
      toast.error('Gagal Membuat Supervisi', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader text="Menyiapkan formulir supervisi..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/supervisor/supervisions')}
        >
          Kembali
        </Button>
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">
            Identitas Kegiatan Supervisi Baru
          </h1>
          <p className="text-xs text-slate-500">
            Lengkapi identitas supervisi akademik sesuai ketentuan instrumen pendidikan.
          </p>
        </div>
      </div>

      <Card title="Formulir Identitas Supervisi">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Readonly School & Supervisor Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <Input
              label="Nama Sekolah"
              value={profile?.school?.name || ''}
              disabled
            />
            <Input
              label="Kepala Sekolah / Supervisor"
              value={profile?.full_name || ''}
              disabled
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Guru yang Disupervisi"
              required
              value={form.teacher_id}
              onChange={(e) => handleTeacherChange(e.target.value)}
              options={teachers.map((t) => ({
                value: t.id,
                label: `${t.full_name} ${t.nip ? `(${t.nip})` : ''}`,
              }))}
            />
            <Select
              label="Mata Pelajaran"
              required
              value={form.subject_id}
              onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
              options={subjects.map((s) => ({ value: s.id, label: s.name }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Kelas"
              required
              placeholder="Contoh: X IPA 1 atau VIII-A"
              value={form.class_name}
              onChange={(e) => setForm({ ...form, class_name: e.target.value })}
            />
            <Input
              label="Tanggal Supervisi"
              type="date"
              required
              value={form.supervision_date}
              onChange={(e) => setForm({ ...form, supervision_date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Tahun Pelajaran"
              required
              placeholder="2026/2027"
              value={form.academic_year}
              onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
            />
            <Select
              label="Semester"
              required
              value={form.semester}
              onChange={(e) => setForm({ ...form, semester: e.target.value })}
              options={[
                { value: 'Ganjil', label: 'Semester Ganjil' },
                { value: 'Genap', label: 'Semester Genap' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => navigate('/supervisor/supervisions')}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" icon={CalendarPlus} loading={submitting}>
              Simpan & Lanjut ke Instrumen
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}