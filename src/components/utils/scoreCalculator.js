export const DEFAULT_SCORE_CONFIG = {
  scaleMax: 4,
  useEqualWeights: true,
  weights: { planning: 30, execution: 40, evaluation: 30 },
  categories: [
    { label: 'Sangat Baik (A)', min: 86, max: 100, color: 'emerald' },
    { label: 'Baik (B)', min: 71, max: 85.99, color: 'blue' },
    { label: 'Cukup (C)', min: 56, max: 70.99, color: 'amber' },
    { label: 'Kurang (D)', min: 0, max: 55.99, color: 'red' },
  ],
};

/**
 * Menghitung skor komponen (skala 0-100) berdasarkan indikator yang telah dinilai.
 */
export function calculateComponentScore(items, scoresMap, scaleMax = 4) {
  if (!items || items.length === 0) return { score: null, filled: 0, total: 0 };

  let earned = 0;
  let maxPossible = 0;
  let filled = 0;

  items.forEach((item) => {
    const val = Number(scoresMap[item.id]?.score);
    if (val >= 1 && val <= scaleMax) {
      earned += val;
      maxPossible += item.max_score || scaleMax;
      filled += 1;
    }
  });

  if (filled === 0 || maxPossible === 0) {
    return { score: null, filled: 0, total: items.length };
  }

  const normalized = Number(((earned / maxPossible) * 100).toFixed(2));
  return {
    score: normalized,
    filled,
    total: items.length,
    isComplete: filled === items.length,
  };
}

/**
 * Menghitung keseluruhan hasil supervisi.
 * Nilai akhir HANYA dihitung apabila seluruh 18 indikator wajib sudah terisi.
 */
export function calculateSupervisionResult(allItems, scoresMap, config = DEFAULT_SCORE_CONFIG) {
  const cfg = { ...DEFAULT_SCORE_CONFIG, ...(config || {}) };
  const scaleMax = cfg.scaleMax || 4;

  const planningItems = allItems.filter((i) => i.component === 'planning');
  const executionItems = allItems.filter((i) => i.component === 'execution');
  const evaluationItems = allItems.filter((i) => i.component === 'evaluation');

  const planning = calculateComponentScore(planningItems, scoresMap, scaleMax);
  const execution = calculateComponentScore(executionItems, scoresMap, scaleMax);
  const evaluation = calculateComponentScore(evaluationItems, scoresMap, scaleMax);

  const totalFilled = planning.filled + execution.filled + evaluation.filled;
  const totalItems = allItems.length;
  const allCompleted = totalItems > 0 && totalFilled === totalItems;

  if (!allCompleted) {
    return {
      planningScore: planning.score,
      executionScore: execution.score,
      evaluationScore: evaluation.score,
      finalScore: null,
      category: null,
      categoryColor: 'default',
      totalFilled,
      totalItems,
      allCompleted: false,
      progressPercent: totalItems > 0 ? Math.round((totalFilled / totalItems) * 100) : 0,
    };
  }

  let finalScore = 0;
  if (cfg.useEqualWeights) {
    finalScore = Number(
      ((planning.score + execution.score + evaluation.score) / 3).toFixed(2)
    );
  } else {
    const wP = Number(cfg.weights?.planning || 0);
    const wL = Number(cfg.weights?.execution || 0);
    const wE = Number(cfg.weights?.evaluation || 0);
    const totalW = wP + wL + wE || 100;
    finalScore = Number(
      (
        (planning.score * wP + execution.score * wL + evaluation.score * wE) /
        totalW
      ).toFixed(2)
    );
  }

  const matchedCategory = (cfg.categories || DEFAULT_SCORE_CONFIG.categories).find(
    (cat) => finalScore >= Number(cat.min) && finalScore <= Number(cat.max)
  ) || { label: 'Terkategori', color: 'blue' };

  return {
    planningScore: planning.score,
    executionScore: execution.score,
    evaluationScore: evaluation.score,
    finalScore,
    category: matchedCategory.label,
    categoryColor: matchedCategory.color,
    totalFilled,
    totalItems,
    allCompleted: true,
    progressPercent: 100,
  };
}