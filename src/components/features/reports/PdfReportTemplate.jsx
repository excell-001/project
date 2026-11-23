import { forwardRef } from 'react';
import { formatDateID, formatScore } from '../../utils/formatters';

const COMPONENT_LABELS = {
  planning: 'A. Perencanaan Pembelajaran',
  execution: 'B. Pelaksanaan Pembelajaran',
  evaluation: 'C. Evaluasi Pembelajaran',
};

const PdfReportTemplate = forwardRef(function PdfReportTemplate(
  { supervision, items = [], scores = [], recommendation, documents = [], signatures = [] },
  ref
) {
  if (!supervision) return null;

  const scoresMap = {};
  scores.forEach((s) => {
    scoresMap[s.item_id] = s;
  });

  const supervisorSig = signatures.find((s) => s.signer_role === 'supervisor');
  const teacherSig = signatures.find((s) => s.signer_role === 'teacher');

  const rppDocs = documents.filter((d) => d.doc_type === 'rpp_modul');
  const photoDocs = documents.filter((d) => d.doc_type === 'classroom_photo');

  return (
    <div
      ref={ref}
      data-pdf-root="true"
      style={{
        width: '794px',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        fontFamily: 'Inter, Arial, sans-serif',
        padding: '32px 36px',
        fontSize: '11.5px',
        lineHeight: 1.45,
      }}
    >
      {/* Kop Laporan */}
      <div
        style={{
          borderBottom: '3px double #0B2545',
          paddingBottom: '12px',
          marginBottom: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#0B2545', letterSpacing: '-0.3px' }}>
            {supervision.school?.name || 'SATUAN PENDIDIKAN'}
          </div>
          <div style={{ fontSize: '10.5px', color: '#475569' }}>
            {[
              supervision.school?.address,
              supervision.school?.district,
              supervision.school?.city,
            ]
              .filter(Boolean)
              .join(', ') || 'Laporan Resmi Supervisi Akademik'}
            {supervision.school?.npsn ? ` · NPSN: ${supervision.school.npsn}` : ''}
          </div>
        </div>
        <div
          style={{
            backgroundColor: '#0B2545',
            color: '#ffffff',
            padding: '6px 12px',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '10px',
          }}
        >
          SUPERVISIPRO REPORT
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '14px', fontWeight: 800, color: '#0B2545', textTransform: 'uppercase' }}>
          Lembar Rekapitulasi Hasil Supervisi Pembelajaran
        </div>
        <div style={{ fontSize: '11px', color: '#475569' }}>
          Tahun Pelajaran {supervision.academic_year} · Semester {supervision.semester}
        </div>
      </div>

      {/* 1. Identitas Supervisi */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '11px' }}>
        <tbody>
          <tr>
            <td style={{ width: '22%', padding: '5px 8px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', fontWeight: 600 }}>
              Nama Sekolah
            </td>
            <td style={{ width: '28%', padding: '5px 8px', border: '1px solid #cbd5e1' }}>
              {supervision.school?.name || '-'}
            </td>
            <td style={{ width: '22%', padding: '5px 8px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', fontWeight: 600 }}>
              Mata Pelajaran
            </td>
            <td style={{ width: '28%', padding: '5px 8px', border: '1px solid #cbd5e1' }}>
              {supervision.subject?.name || '-'}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '5px 8px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', fontWeight: 600 }}>
              Nama Guru
            </td>
            <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1' }}>
              {supervision.teacher?.full_name || '-'}
            </td>
            <td style={{ padding: '5px 8px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', fontWeight: 600 }}>
              Kelas
            </td>
            <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1' }}>
              {supervision.class_name}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '5px 8px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', fontWeight: 600 }}>
              NIP Guru
            </td>
            <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1' }}>
              {supervision.teacher?.nip || '-'}
            </td>
            <td style={{ padding: '5px 8px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', fontWeight: 600 }}>
              Tanggal Supervisi
            </td>
            <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1' }}>
              {formatDateID(supervision.supervision_date)}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '5px 8px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', fontWeight: 600 }}>
              Supervisor / Kepsek
            </td>
            <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1' }}>
              {supervision.supervisor?.full_name || '-'}
            </td>
            <td style={{ padding: '5px 8px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', fontWeight: 600 }}>
              Tahun Pelajaran
            </td>
            <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1' }}>
              {supervision.academic_year}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 2. Ringkasan Nilai Tiga Komponen */}
      <div style={{ fontWeight: 700, fontSize: '11.5px', color: '#0B2545', marginBottom: '6px' }}>
        I. Rekapitulasi Nilai Per Komponen
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '11px' }}>
        <thead>
          <tr style={{ backgroundColor: '#0B2545', color: '#ffffff' }}>
            <th style={{ padding: '6px 8px', border: '1px solid #0B2545', textAlign: 'left' }}>Komponen Penilaian</th>
            <th style={{ padding: '6px 8px', border: '1px solid #0B2545', textAlign: 'center', width: '110px' }}>Nilai (0–100)</th>
            <th style={{ padding: '6px 8px', border: '1px solid #0B2545', textAlign: 'center', width: '150px' }}>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>1. Perencanaan Pembelajaran (6 Indikator)</td>
            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 700 }}>
              {formatScore(supervision.planning_score)}
            </td>
            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Terkalkulasi Otomatis</td>
          </tr>
          <tr>
            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>2. Pelaksanaan Pembelajaran (6 Indikator)</td>
            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 700 }}>
              {formatScore(supervision.execution_score)}
            </td>
            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Terkalkulasi Otomatis</td>
          </tr>
          <tr>
            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>3. Evaluasi Pembelajaran (6 Indikator)</td>
            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 700 }}>
              {formatScore(supervision.evaluation_score)}
            </td>
            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Terkalkulasi Otomatis</td>
          </tr>
          <tr style={{ backgroundColor: '#eff6ff', fontWeight: 800, color: '#0B2545' }}>
            <td style={{ padding: '7px 8px', border: '1px solid #93c5fd' }}>NILAI AKHIR & KATEGORI PREDIKAT</td>
            <td style={{ padding: '7px 8px', border: '1px solid #93c5fd', textAlign: 'center', fontSize: '12.5px' }}>
              {formatScore(supervision.final_score)}
            </td>
            <td style={{ padding: '7px 8px', border: '1px solid #93c5fd', textAlign: 'center' }}>
              {supervision.category || 'Belum Lengkap'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 3. Rincian 18 Indikator */}
      <div style={{ fontWeight: 700, fontSize: '11.5px', color: '#0B2545', marginBottom: '6px' }}>
        II. Rincian Skor Instrumen Supervisi
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '10px' }}>
        <thead>
          <tr style={{ backgroundColor: '#e2e8f0', color: '#0f172a' }}>
            <th style={{ padding: '5px', border: '1px solid #cbd5e1', width: '32px' }}>No</th>
            <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'left' }}>Aspek / Indikator Penilaian</th>
            <th style={{ padding: '5px', border: '1px solid #cbd5e1', width: '55px' }}>Skor (1-4)</th>
            <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'left', width: '210px' }}>Catatan Observasi</th>
          </tr>
        </thead>
        <tbody>
          {['planning', 'execution', 'evaluation'].map((compKey) => {
            const compItems = items.filter((i) => i.component === compKey);
            return [
              <tr key={`hdr-${compKey}`} style={{ backgroundColor: '#f1f5f9', fontWeight: 700 }}>
                <td colSpan={4} style={{ padding: '5px 8px', border: '1px solid #cbd5e1', color: '#0B2545' }}>
                  {COMPONENT_LABELS[compKey]}
                </td>
              </tr>,
              ...compItems.map((item, idx) => {
                const sc = scoresMap[item.id];
                return (
                  <tr key={item.id}>
                    <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1' }}>{item.title}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 700 }}>
                      {sc?.score ?? '-'}
                    </td>
                    <td style={{ padding: '4px 6px', border: '1px solid #cbd5e1', color: '#475569' }}>
                      {sc?.notes || '-'}
                    </td>
                  </tr>
                );
              }),
            ];
          })}
        </tbody>
      </table>

      {/* 4. Catatan, Rekomendasi & Tindak Lanjut */}
      <div style={{ fontWeight: 700, fontSize: '11.5px', color: '#0B2545', marginBottom: '6px' }}>
        III. Catatan, Rekomendasi Kepala Sekolah & Tindak Lanjut
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', fontSize: '10.5px' }}>
        <tbody>
          <tr>
            <td style={{ width: '28%', padding: '6px 8px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', fontWeight: 600 }}>
              Catatan Supervisor
            </td>
            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>
              {recommendation?.supervisor_notes || '-'}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '6px 8px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', fontWeight: 600 }}>
              Rekomendasi Kepala Sekolah
            </td>
            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>
              {recommendation?.principal_recommendation || '-'}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '6px 8px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', fontWeight: 600 }}>
              Rencana Tindak Lanjut
            </td>
            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>
              {recommendation?.follow_up_plan || '-'}
              {recommendation?.target_date ? ` (Target: ${formatDateID(recommendation.target_date)})` : ''}
            </td>
          </tr>
          <tr>
            <td style={{ padding: '6px 8px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', fontWeight: 600 }}>
              Lampiran Dokumentasi
            </td>
            <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>
              RPP/Modul Ajar: {rppDocs.length} berkas ({rppDocs.map((d) => d.file_name).join(', ') || 'Belum ada'}) · Foto Pembelajaran: {photoDocs.length} berkas
            </td>
          </tr>
        </tbody>
      </table>

      {/* 5. Kolom Tanda Tangan Digital Kepala Sekolah & Guru */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
          marginTop: '22px',
          textAlign: 'center',
          fontSize: '11px',
        }}
      >
        <div>
          <div>Mengetahui,</div>
          <div style={{ fontWeight: 700 }}>Kepala Sekolah / Supervisor</div>
          <div style={{ height: '74px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '6px 0' }}>
            {supervisorSig?.signature_data_url ? (
              <img
                src={supervisorSig.signature_data_url}
                alt="Tanda Tangan Supervisor"
                style={{ maxHeight: '68px', maxWidth: '180px', objectFit: 'contain' }}
              />
            ) : (
              <span style={{ color: '#94a3b8', fontSize: '10px', fontStyle: 'italic' }}>
                (Belum ditandatangani)
              </span>
            )}
          </div>
          <div style={{ fontWeight: 700, textDecoration: 'underline' }}>
            {supervision.supervisor?.full_name || '........................................'}
          </div>
          <div>NIP. {supervision.supervisor?.nip || '................................'}</div>
        </div>

        <div>
          <div>
            {supervision.school?.city || 'Tempat'}, {formatDateID(supervision.supervision_date)}
          </div>
          <div style={{ fontWeight: 700 }}>Guru yang Disupervisi</div>
          <div style={{ height: '74px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '6px 0' }}>
            {teacherSig?.signature_data_url ? (
              <img
                src={teacherSig.signature_data_url}
                alt="Tanda Tangan Guru"
                style={{ maxHeight: '68px', maxWidth: '180px', objectFit: 'contain' }}
              />
            ) : (
              <span style={{ color: '#94a3b8', fontSize: '10px', fontStyle: 'italic' }}>
                (Belum ditandatangani)
              </span>
            )}
          </div>
          <div style={{ fontWeight: 700, textDecoration: 'underline' }}>
            {supervision.teacher?.full_name || '........................................'}
          </div>
          <div>NIP. {supervision.teacher?.nip || '................................'}</div>
        </div>
      </div>
    </div>
  );
});

export default PdfReportTemplate;