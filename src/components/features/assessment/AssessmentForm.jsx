import { useMemo, useState } from 'react';
import { Save, CheckCircle2, BookOpen, Presentation, ClipboardCheck } from 'lucide-react';
import Card from '../../common/Card';
import Button from '../../common/Button';
import Badge from '../../common/Badge';
import { calculateSupervisionResult } from '../../utils/scoreCalculator';
import { formatScore } from '../../utils/formatters';

const COMPONENT_META = [
  {
    key: 'planning',
    title: 'Komponen 1: Perencanaan Pembelajaran',
    subtitle: 'Kelengkapan RPP/modul ajar, tujuan, materi, metode, media, dan asesmen',
    icon: BookOpen,
  },
  {
    key: 'execution',
    title: 'Komponen 2: Pelaksanaan Pembelajaran',
    subtitle: 'Pendahuluan, penguasaan materi, metode, pengelolaan kelas, interaksi, dan penutup',
    icon: Presentation,
  },
  {
    key: 'evaluation',
    title: 'Komponen 3: Evaluasi Pembelajaran',
    subtitle: 'Teknik asesmen, pengolahan hasil belajar, umpan balik, remedial, pengayaan, dan tindak lanjut',
    icon: ClipboardCheck,
  },
];

const SCORE_SCALE = [
  { value: 1, label: '1 · Kurang' },
  { value: 2, label: '2 · Cukup' },
  { value: 3, label: '3 · Baik' },
  { value: 4, label: '4 · Sangat Baik' },
];

export default function AssessmentForm({
  supervisionId,
  items = [],
  initialScores = [],
  scoreConfig,
  readOnly = false,
  onSave,
}) {
  const [scoresMap, setScoresMap] = useState(() => {
    const map = {};
    initialScores.forEach((s) => {
      map[s.item_id] = { score: s.score, notes: s.notes || '' };
    });
    return map;
  });
  const [saving, setSaving] = useState(false);

  const summary = useMemo(
    () => calculateSupervisionResult(items, scoresMap, scoreConfig),
    [items, scoresMap, scoreConfig]
  );

  const handleScoreSelect = (itemId, value) => {
    if (readOnly) return;
    setScoresMap((prev) => ({
      ...prev,
      [itemId]: {
        score: value,
        notes: prev[itemId]?.notes || '',
      },
    }));
  };

  const handleNoteChange = (itemId, notes) => {
    if (readOnly) return;
    setScoresMap((prev) => ({
      ...prev,
      [itemId]: {
        score: prev[itemId]?.score || null,
        notes,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(scoresMap)
        .filter(([, val]) => val.score >= 1 && val.score <= 4)
        .map(([itemId, val]) => ({
          supervision_id: supervisionId,
          item_id: itemId,
          score: Number(val.score),
          notes: val.notes?.trim() || null,
        }));

      await onSave(entries, summary);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress & Live Score Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card sticky top-16 z-20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-600">
                Progres Pengisian Instrumen: {summary.totalFilled} dari {summary.totalItems} Indikator
              </span>
              <span className="text-royal-700">{summary.progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-navy-900 to-royal-600 transition-all duration-300"
                style={{ width: `${summary.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Perencanaan: </span>
              <strong className="text-navy-900">{formatScore(summary.planningScore)}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Pelaksanaan: </span>
              <strong className="text-navy-900">{formatScore(summary.executionScore)}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Evaluasi: </span>
              <strong className="text-navy-900">{formatScore(summary.evaluationScore)}</strong>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-navy-900 text-white">
              <span>Nilai Akhir: </span>
              <strong>{summary.allCompleted ? formatScore(summary.finalScore) : 'Belum Lengkap'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Komponen Penilaian */}
      {COMPONENT_META.map((comp) => {
        const Icon = comp.icon;
        const compItems = items.filter((i) => i.component === comp.key);

        return (
          <Card
            key={comp.key}
            title={
              <span className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-royal-700" />
                {comp.title}
              </span>
            }
            subtitle={comp.subtitle}
            action={
              <Badge variant="info">
                {compItems.filter((i) => scoresMap[i.id]?.score).length}/{compItems.length} Dinilai
              </Badge>
            }
          >
            <div className="divide-y divide-slate-100 -my-2">
              {compItems.map((item, idx) => {
                const current = scoresMap[item.id] || {};
                return (
                  <div key={item.id} className="py-5 first:pt-2 last:pb-2 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-navy-50 text-navy-900 font-bold text-xs">
                            {idx + 1}
                          </span>
                          <h4 className="font-display font-bold text-sm text-navy-900">
                            {item.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed pl-8">
                          {item.description}
                        </p>
                      </div>

                      {/* Skala 1 - 4 */}
                      <div className="flex flex-wrap gap-1.5 pl-8 md:pl-0 shrink-0">
                        {SCORE_SCALE.map((sc) => {
                          const active = Number(current.score) === sc.value;
                          return (
                            <button
                              key={sc.value}
                              type="button"
                              disabled={readOnly}
                              onClick={() => handleScoreSelect(item.id, sc.value)}
                              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                active
                                  ? 'bg-royal-700 text-white border-royal-700 shadow-xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-royal-300 hover:bg-royal-50/40'
                              } disabled:cursor-default`}
                            >
                              {sc.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pl-8">
                      <input
                        type="text"
                        disabled={readOnly}
                        placeholder={
                          readOnly
                            ? current.notes || 'Tidak ada catatan indikator'
                            : 'Catatan observasi supervisor untuk indikator ini (opsional)...'
                        }
                        value={current.notes || ''}
                        onChange={(e) => handleNoteChange(item.id, e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-royal-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      {!readOnly && (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-card">
          <div className="text-xs text-slate-500">
            {summary.allCompleted ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Seluruh 18 indikator lengkap. Nilai akhir siap dikalkulasi.
              </span>
            ) : (
              <span>
                Lengkapi seluruh 18 indikator agar sistem dapat mengalkulasi Nilai Akhir dan Kategori.
              </span>
            )}
          </div>
          <Button variant="primary" icon={Save} loading={saving} onClick={handleSave}>
            Simpan Hasil Penilaian
          </Button>
        </div>
      )}
    </div>
  );
}