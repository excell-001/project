import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, UserCheck, Users } from 'lucide-react';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Input from '../../common/Input';
import Select from '../../common/Select';
import Modal from '../../common/Modal';
import Badge from '../../common/Badge';
import Loader from '../../common/Loader';
import EmptyState from '../../common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { teacherService } from '../../services/teacherService';
import { schoolService } from '../../services/schoolService';

const EMPTY_FORM = {
  full_name: '',
  nip: '',
  email: '',
  phone: '',
  rank_grade: '',
  subject_id: '',
  is_active: true,
};

export default function TeachersPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const schoolId = profile?.school_id;

  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!schoolId) return;
    try {
      const [teacherList, subjectList] = await Promise.all([
        teacherService.getTeachers(schoolId),
        schoolService.getSubjects(schoolId),
      ]);
      setTeachers(teacherList);
      setSubjects(subjectList);
    } catch (err) {
      toast.error('Gagal Memuat Data Guru', err.message);
    } finally {
      setLoading(false);
    }
  }, [schoolId, toast]);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      if (!schoolId) return;
      try {
        const [teacherList, subjectList] = await Promise.all([
          teacherService.getTeachers(schoolId),
          schoolService.getSubjects(schoolId),
        ]);
        if (active) {
          setTeachers(teacherList);
          setSubjects(subjectList);
        }
      } catch (err) {
        if (active) toast.error('Gagal Memuat Data Guru', err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitialData();
    return () => {
      active = false;
    };
  }, [schoolId, toast]);

  const openCreateModal = () => {
    setEditingTeacher(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (teacher) => {
    setEditingTeacher(teacher);
    setForm({
      full_name: teacher.full_name || '',
      nip: teacher.nip || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      rank_grade: teacher.rank_grade || '',
      subject_id: teacher.subject_id || '',
      is_active: teacher.is_active ?? true,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        school_id: schoolId,
        subject_id: form.subject_id || null,
      };

      if (editingTeacher) {
        await teacherService.updateTeacher(editingTeacher.id, payload);
        toast.success('Data Guru Diperbarui', form.full_name);
      } else {
        await teacherService.createTeacher(payload);
        toast.success('Guru Ditambahkan', form.full_name);
      }

      setModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error('Gagal Menyimpan Data Guru', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (teacher) => {
    if (!window.confirm(`Hapus data guru "${teacher.full_name}"?`)) return;
    try {
      await teacherService.deleteTeacher(teacher.id);
      toast.info('Data Dihapus', `${teacher.full_name} telah dihapus.`);
      setTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
    } catch {
      toast.error(
        'Tidak Dapat Menghapus',
        'Guru yang sudah memiliki riwayat supervisi sebaiknya dinonaktifkan saja.'
      );
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const matchText =
      t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.nip?.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase());
    const matchSubject = !subjectFilter || t.subject_id === subjectFilter;
    return matchText && matchSubject;
  });

  if (loading) return <Loader text="Memuat direktori guru..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900">
            Manajemen Data Guru
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola daftar pendidik, mata pelajaran ampuan, dan tautan akun portal guru.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={openCreateModal}>
          Tambah Guru
        </Button>
      </div>

      <Card bodyClassName="p-0">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama guru, NIP, atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-royal-600"
            />
          </div>
          <Select
            placeholder="Semua Mata Pelajaran"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            options={subjects.map((s) => ({ value: s.id, label: s.name }))}
          />
        </div>

        {filteredTeachers.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Users}
              title="Data Guru Tidak Ditemukan"
              description="Belum ada guru yang sesuai dengan filter pencarian atau tambahkan data guru baru."
              action={
                <Button variant="primary" size="sm" icon={Plus} onClick={openCreateModal}>
                  Tambah Guru Pertama
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Nama & NIP</th>
                  <th className="px-6 py-3.5 font-semibold">Mata Pelajaran</th>
                  <th className="px-6 py-3.5 font-semibold">Pangkat / Gol.</th>
                  <th className="px-6 py-3.5 font-semibold">Status Akun</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-navy-900">{teacher.full_name}</p>
                      <p className="text-xs text-slate-500">NIP. {teacher.nip || '-'}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {teacher.subject?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {teacher.rank_grade || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant={teacher.is_active ? 'success' : 'default'}>
                          {teacher.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                        {teacher.profile_id && (
                          <Badge variant="info">
                            <UserCheck className="w-3 h-3" /> Akun Tertaut
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Pencil}
                          onClick={() => openEditModal(teacher)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(teacher)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Tambah / Edit Guru */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru'}
        subtitle="Jika email sama dengan akun guru di sistem, profil akan ditautkan secara otomatis."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Lengkap & Gelar"
            required
            placeholder="Contoh: Ahmad Yani, S.Pd.I."
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="NIP / NUPTK"
              placeholder="198501012010011001"
              value={form.nip}
              onChange={(e) => setForm({ ...form, nip: e.target.value })}
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
              label="Email Akun Guru"
              type="email"
              placeholder="guru@sekolah.sch.id"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="No. WhatsApp / Telepon"
              placeholder="0812xxxxxxxx"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <Input
            label="Pangkat / Golongan"
            placeholder="Contoh: Penata Muda Tk. I / III.b"
            value={form.rank_grade}
            onChange={(e) => setForm({ ...form, rank_grade: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 pt-1">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 rounded text-royal-700"
            />
            Guru berstatus aktif mengajar
          </label>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              {editingTeacher ? 'Simpan Perubahan' : 'Simpan Guru'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}