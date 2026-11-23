-- ============================================================================
-- SUPERVISI PRO — COMPLETE POSTGRESQL SCHEMA, SEED DATA, RLS & STORAGE
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. HELPER FUNCTION FOR UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. TABLES

-- A. SCHOOLS (Mendukung multi-sekolah di masa depan)
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  npsn VARCHAR(30),
  address TEXT,
  district VARCHAR(100),
  city VARCHAR(100),
  province VARCHAR(100),
  principal_name VARCHAR(150) NOT NULL,
  principal_nip VARCHAR(50),
  academic_year_default VARCHAR(20) NOT NULL DEFAULT '2026/2027',
  score_config JSONB NOT NULL DEFAULT '{
    "scaleMax": 4,
    "weights": { "planning": 30, "execution": 40, "evaluation": 30 },
    "useEqualWeights": true,
    "categories": [
      { "label": "Sangat Baik (A)", "min": 86, "max": 100, "color": "emerald" },
      { "label": "Baik (B)", "min": 71, "max": 85.99, "color": "blue" },
      { "label": "Cukup (C)", "min": 56, "max": 70.99, "color": "amber" },
      { "label": "Kurang (D)", "min": 0, "max": 55.99, "color": "red" }
    ]
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- B. PROFILES (Terhubung ke auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  full_name VARCHAR(150) NOT NULL,
  nip VARCHAR(50),
  email VARCHAR(150) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('supervisor', 'teacher')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- C. SUBJECTS (Mata Pelajaran)
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  code VARCHAR(30),
  name VARCHAR(150) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- D. TEACHERS (Master Data Guru)
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  nip VARCHAR(50),
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  phone VARCHAR(30),
  rank_grade VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- E. SUPERVISIONS (Data Utama Kegiatan Supervisi)
CREATE TABLE IF NOT EXISTS public.supervisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  supervisor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  class_name VARCHAR(50) NOT NULL,
  supervision_date DATE NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  semester VARCHAR(15) NOT NULL DEFAULT 'Ganjil' CHECK (semester IN ('Ganjil', 'Genap')),
  status VARCHAR(30) NOT NULL DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'in_progress', 'awaiting_signature', 'completed')
  ),
  planning_score NUMERIC(5,2),
  execution_score NUMERIC(5,2),
  evaluation_score NUMERIC(5,2),
  final_score NUMERIC(5,2),
  category VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- F. ASSESSMENT_ITEMS (18 Indikator Wajib Supervisi Pendidikan UAS)
CREATE TABLE IF NOT EXISTS public.assessment_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  component VARCHAR(20) NOT NULL CHECK (component IN ('planning', 'execution', 'evaluation')),
  item_order INT NOT NULL,
  code VARCHAR(30) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  max_score INT NOT NULL DEFAULT 4,
  is_required BOOLEAN NOT NULL DEFAULT TRUE
);

-- G. ASSESSMENT_SCORES (Nilai per Indikator per Supervisi)
CREATE TABLE IF NOT EXISTS public.assessment_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supervision_id UUID NOT NULL REFERENCES public.supervisions(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.assessment_items(id) ON DELETE RESTRICT,
  score INT NOT NULL CHECK (score BETWEEN 1 AND 4),
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (supervision_id, item_id)
);

-- H. RECOMMENDATIONS (Catatan, Rekomendasi Kepala Sekolah & Tindak Lanjut)
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supervision_id UUID UNIQUE NOT NULL REFERENCES public.supervisions(id) ON DELETE CASCADE,
  supervisor_notes TEXT,
  principal_recommendation TEXT,
  follow_up_plan TEXT,
  target_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- I. DOCUMENTS (File RPP/Modul Ajar & Foto Pembelajaran)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supervision_id UUID NOT NULL REFERENCES public.supervisions(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  doc_type VARCHAR(30) NOT NULL CHECK (doc_type IN ('rpp_modul', 'classroom_photo')),
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT,
  mime_type VARCHAR(100),
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- J. SIGNATURES (Tanda Tangan Digital Kepala Sekolah & Guru)
CREATE TABLE IF NOT EXISTS public.signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supervision_id UUID NOT NULL REFERENCES public.supervisions(id) ON DELETE CASCADE,
  signer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  signer_role VARCHAR(20) NOT NULL CHECK (signer_role IN ('supervisor', 'teacher')),
  signer_name VARCHAR(150) NOT NULL,
  signer_nip VARCHAR(50),
  signature_data_url TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (supervision_id, signer_role)
);

-- 4. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_school ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_school ON public.teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_profile ON public.teachers(profile_id);
CREATE INDEX IF NOT EXISTS idx_supervisions_school ON public.supervisions(school_id);
CREATE INDEX IF NOT EXISTS idx_supervisions_teacher ON public.supervisions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_supervisions_date ON public.supervisions(supervision_date DESC);
CREATE INDEX IF NOT EXISTS idx_scores_supervision ON public.assessment_scores(supervision_id);
CREATE INDEX IF NOT EXISTS idx_documents_supervision ON public.documents(supervision_id);
CREATE INDEX IF NOT EXISTS idx_signatures_supervision ON public.signatures(supervision_id);

-- 5. UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS trg_schools_updated ON public.schools;
CREATE TRIGGER trg_schools_updated BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_teachers_updated ON public.teachers;
CREATE TRIGGER trg_teachers_updated BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_supervisions_updated ON public.supervisions;
CREATE TRIGGER trg_supervisions_updated BEFORE UPDATE ON public.supervisions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_scores_updated ON public.assessment_scores;
CREATE TRIGGER trg_scores_updated BEFORE UPDATE ON public.assessment_scores
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_recommendations_updated ON public.recommendations;
CREATE TRIGGER trg_recommendations_updated BEFORE UPDATE ON public.recommendations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. SECURITY HELPER FUNCTIONS FOR RLS (Bypass recursion safely)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS VARCHAR AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_teacher_id()
RETURNS UUID AS $$
  SELECT id FROM public.teachers WHERE profile_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES

-- SCHOOLS
CREATE POLICY "Users can view their own school"
  ON public.schools FOR SELECT
  USING (id = public.get_my_school_id());

CREATE POLICY "Supervisors can update their own school"
  ON public.schools FOR UPDATE
  USING (id = public.get_my_school_id() AND public.get_my_role() = 'supervisor');

-- PROFILES
CREATE POLICY "Users can view profiles in same school"
  ON public.profiles FOR SELECT
  USING (school_id = public.get_my_school_id() OR id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Supervisors can insert profiles in their school"
  ON public.profiles FOR INSERT
  WITH CHECK (public.get_my_role() = 'supervisor');

-- SUBJECTS
CREATE POLICY "School members can view subjects"
  ON public.subjects FOR SELECT
  USING (school_id = public.get_my_school_id());

CREATE POLICY "Supervisors can manage subjects"
  ON public.subjects FOR ALL
  USING (school_id = public.get_my_school_id() AND public.get_my_role() = 'supervisor');

-- TEACHERS
CREATE POLICY "Supervisors can manage teachers in their school"
  ON public.teachers FOR ALL
  USING (school_id = public.get_my_school_id() AND public.get_my_role() = 'supervisor');

CREATE POLICY "Teachers can view their own teacher record"
  ON public.teachers FOR SELECT
  USING (profile_id = auth.uid());

-- SUPERVISIONS
CREATE POLICY "Supervisors can manage supervisions in their school"
  ON public.supervisions FOR ALL
  USING (school_id = public.get_my_school_id() AND public.get_my_role() = 'supervisor');

CREATE POLICY "Teachers can view their own supervisions"
  ON public.supervisions FOR SELECT
  USING (teacher_id = public.get_my_teacher_id());

CREATE POLICY "Teachers can mark supervision completed after signing"
  ON public.supervisions FOR UPDATE
  USING (teacher_id = public.get_my_teacher_id())
  WITH CHECK (teacher_id = public.get_my_teacher_id());

-- ASSESSMENT ITEMS (Master 18 Indikator - Read Only untuk semua authenticated user)
CREATE POLICY "Authenticated users can read assessment items"
  ON public.assessment_items FOR SELECT
  USING (auth.role() = 'authenticated');

-- ASSESSMENT SCORES
CREATE POLICY "Supervisors can manage scores in their school"
  ON public.assessment_scores FOR ALL
  USING (
    public.get_my_role() = 'supervisor' AND
    EXISTS (
      SELECT 1 FROM public.supervisions s
      WHERE s.id = assessment_scores.supervision_id
      AND s.school_id = public.get_my_school_id()
    )
  );

CREATE POLICY "Teachers can view scores of their own supervisions"
  ON public.assessment_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.supervisions s
      WHERE s.id = assessment_scores.supervision_id
      AND s.teacher_id = public.get_my_teacher_id()
    )
  );

-- RECOMMENDATIONS
CREATE POLICY "Supervisors can manage recommendations in their school"
  ON public.recommendations FOR ALL
  USING (
    public.get_my_role() = 'supervisor' AND
    EXISTS (
      SELECT 1 FROM public.supervisions s
      WHERE s.id = recommendations.supervision_id
      AND s.school_id = public.get_my_school_id()
    )
  );

CREATE POLICY "Teachers can view recommendations of their own supervisions"
  ON public.recommendations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.supervisions s
      WHERE s.id = recommendations.supervision_id
      AND s.teacher_id = public.get_my_teacher_id()
    )
  );

-- DOCUMENTS
CREATE POLICY "Supervisors can manage documents in their school"
  ON public.documents FOR ALL
  USING (
    public.get_my_role() = 'supervisor' AND
    EXISTS (
      SELECT 1 FROM public.supervisions s
      WHERE s.id = documents.supervision_id
      AND s.school_id = public.get_my_school_id()
    )
  );

CREATE POLICY "Teachers can view documents of their supervisions"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.supervisions s
      WHERE s.id = documents.supervision_id
      AND s.teacher_id = public.get_my_teacher_id()
    )
  );

CREATE POLICY "Teachers can upload documents to their supervisions"
  ON public.documents FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.supervisions s
      WHERE s.id = documents.supervision_id
      AND s.teacher_id = public.get_my_teacher_id()
    )
  );

CREATE POLICY "Teachers can delete their own uploaded documents"
  ON public.documents FOR DELETE
  USING (uploaded_by = auth.uid());

-- SIGNATURES
CREATE POLICY "School members can view relevant signatures"
  ON public.signatures FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.supervisions s
      WHERE s.id = signatures.supervision_id
      AND (
        (public.get_my_role() = 'supervisor' AND s.school_id = public.get_my_school_id())
        OR s.teacher_id = public.get_my_teacher_id()
      )
    )
  );

CREATE POLICY "Supervisors can sign as supervisor"
  ON public.signatures FOR INSERT
  WITH CHECK (
    signer_id = auth.uid() AND
    signer_role = 'supervisor' AND
    public.get_my_role() = 'supervisor'
  );

CREATE POLICY "Teachers can sign as teacher on their supervision"
  ON public.signatures FOR INSERT
  WITH CHECK (
    signer_id = auth.uid() AND
    signer_role = 'teacher' AND
    EXISTS (
      SELECT 1 FROM public.supervisions s
      WHERE s.id = signatures.supervision_id
      AND s.teacher_id = public.get_my_teacher_id()
    )
  );

-- 9. SEED DATA: 18 INDIKATOR WAJIB INSTRUMEN SUPERVISI (SESUAI PDF UAS)
INSERT INTO public.assessment_items (component, item_order, code, title, description, max_score, is_required)
VALUES
  -- A. PERENCANAAN PEMBELAJARAN (6 Indikator)
  ('planning', 1, 'PLN-01', 'Kelengkapan RPP / Modul Ajar', 'Ketersediaan identitas modul ajar/RPP, alokasi waktu, profil pelajar, serta kelengkapan komponen administrasi perencanaan.', 4, TRUE),
  ('planning', 2, 'PLN-02', 'Tujuan Pembelajaran', 'Kejelasan rumusan tujuan pembelajaran yang terukur (ABCD/kompetensi & lingkup materi) serta selaras dengan Capaian Pembelajaran.', 4, TRUE),
  ('planning', 3, 'PLN-03', 'Materi Pembelajaran', 'Kesesuaian kedalaman, keluasan, dan sistematika materi ajar dengan tujuan pembelajaran serta karakteristik peserta didik.', 4, TRUE),
  ('planning', 4, 'PLN-04', 'Metode Pembelajaran', 'Pemilihan model, pendekatan, dan metode pembelajaran aktif yang relevan dengan karakteristik materi dan siswa.', 4, TRUE),
  ('planning', 5, 'PLN-05', 'Media Pembelajaran', 'Kesesuaian dan kreativitas pemilihan media, alat peraga, atau sumber belajar digital/konkret untuk memperjelas konsep.', 4, TRUE),
  ('planning', 6, 'PLN-06', 'Asesmen (Perencanaan Penilaian)', 'Ketersediaan rancangan instrumen asesmen diagnostik, formatif, dan sumatif beserta rubrik penilaian yang jelas.', 4, TRUE),

  -- B. PELAKSANAAN PEMBELAJARAN (6 Indikator)
  ('execution', 1, 'EXC-01', 'Kegiatan Pendahuluan', 'Kemampuan membuka pelajaran, apersepsi, motivasi, penyampaian tujuan pembelajaran, dan asesmen awal kesiapan siswa.', 4, TRUE),
  ('execution', 2, 'EXC-02', 'Penguasaan Materi', 'Ketepatan konsep, kelancaran penyampaian, kemampuan mengaitkan materi dengan konteks kehidupan nyata/lintas disiplin.', 4, TRUE),
  ('execution', 3, 'EXC-03', 'Metode Pembelajaran', 'Keterlaksanaan sintaks model/metode pembelajaran secara runtut, variatif, dan mendorong keterampilan berpikir kritis.', 4, TRUE),
  ('execution', 4, 'EXC-04', 'Pengelolaan Kelas', 'Kemampuan menjaga kondusivitas kelas, manajemen waktu, pengorganisasian kelompok, dan respons terhadap dinamika siswa.', 4, TRUE),
  ('execution', 5, 'EXC-05', 'Interaksi dengan Siswa', 'Komunikasi efektif dua arah, pemberian kesempatan bertanya/berpendapat, empati, dan pelibatan aktif seluruh peserta didik.', 4, TRUE),
  ('execution', 6, 'EXC-06', 'Kegiatan Penutup', 'Penyimpulan materi bersama siswa, refleksi pembelajaran, evaluasi singkat, dan penyampaian informasi pertemuan berikutnya.', 4, TRUE),

  -- C. EVALUASI PEMBELAJARAN (6 Indikator)
  ('evaluation', 1, 'EVL-01', 'Teknik Asesmen', 'Ketepatan pelaksanaan teknik penilaian (tes tulis, lisan, observasi sikap, atau unjuk kerja) sesuai indikator kompetensi.', 4, TRUE),
  ('evaluation', 2, 'EVL-02', 'Pengolahan Hasil Belajar', 'Sistematika pencatatan skor, analisis ketercapaian tujuan pembelajaran, dan objektivitas pengolahan nilai peserta didik.', 4, TRUE),
  ('evaluation', 3, 'EVL-03', 'Umpan Balik', 'Pemberian umpan balik konstruktif dan tepat waktu atas hasil kerja/jawaban siswa untuk memperbaiki pemahaman.', 4, TRUE),
  ('evaluation', 4, 'EVL-04', 'Remedial', 'Perencanaan dan pelaksanaan program bimbingan/remedial bagi peserta didik yang belum mencapai kriteria ketercapaian tujuan.', 4, TRUE),
  ('evaluation', 5, 'EVL-05', 'Pengayaan', 'Pemberian tugas atau materi pengayaan yang menantang bagi peserta didik yang telah melampaui target pembelajaran.', 4, TRUE),
  ('evaluation', 6, 'EVL-06', 'Tindak Lanjut', 'Pemanfaatan hasil evaluasi untuk perbaikan rancangan pembelajaran berikutnya dan pelaporan perkembangan belajar.', 4, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 10. SEED DATA: SEKOLAH DEFAULT & MATA PELAJARAN AWAL
DO $$
DECLARE
  v_school_id UUID := '11111111-1111-1111-1111-111111111111';
BEGIN
  INSERT INTO public.schools (
    id, name, npsn, address, district, city, province,
    principal_name, principal_nip, academic_year_default
  )
  VALUES (
    v_school_id,
    'SMA Negeri 1 Teladan Nusantara',
    '20219876',
    'Jl. Pendidikan No. 45',
    'Kec. Karawang Barat',
    'Kab. Karawang',
    'Jawa Barat',
    'Dr. H. Ahmad Fauzi, M.Pd.',
    '197504122000031004',
    '2026/2027'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.subjects (school_id, code, name)
  VALUES
    (v_school_id, 'PAI', 'Pendidikan Agama Islam dan Budi Pekerti'),
    (v_school_id, 'MTK', 'Matematika'),
    (v_school_id, 'BIN', 'Bahasa Indonesia'),
    (v_school_id, 'BIG', 'Bahasa Inggris'),
    (v_school_id, 'IPA', 'Ilmu Pengetahuan Alam (IPA)'),
    (v_school_id, 'IPS', 'Ilmu Pengetahuan Sosial (IPS)'),
    (v_school_id, 'INF', 'Informatika')
  ON CONFLICT DO NOTHING;
END $$;

-- 11. SUPABASE STORAGE BUCKET & POLICIES
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'supervision-files',
  'supervision-files',
  FALSE,
  10485760, -- Maksimal 10 MB per file
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload supervision files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'supervision-files' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can view supervision files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'supervision-files' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Owners or supervisors can delete supervision files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'supervision-files' AND
    (owner = auth.uid() OR public.get_my_role() = 'supervisor')
  );