// Uzbek aqlli qidiruv — xato yozilsa ham tushunadi

// O'zbek harflarini normallashtirish (o' → o, g' → g, sh → s, vs.)
export function normalizeUz(text: string): string {
  return text
    .toLowerCase()
    .replace(/o'/g, 'o')
    .replace(/g'/g, 'g')
    .replace(/ʻ/g, '')
    .replace(/ʼ/g, '')
    .replace(/'/g, '')
    .replace(/'/g, '')
    .replace(/ё/g, 'yo')
    .replace(/й/g, 'y')
    .replace(/ш/g, 'sh')
    .replace(/ч/g, 'ch')
    .replace(/ж/g, 'j')
    .replace(/х/g, 'x')
    .replace(/қ/g, 'q')
    .replace(/ғ/g, 'g')
    .replace(/ў/g, 'o')
    .replace(/\s+/g, ' ')
    .trim();
}

// Levenshtein masofasi — ikki so'z orasidagi farq
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// Bigram o'xshashligi (0..1)
function bigramSim(a: string, b: string): number {
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;
  const getBigrams = (s: string) => {
    const set: string[] = [];
    for (let i = 0; i < s.length - 1; i++) set.push(s.slice(i, i + 2));
    return set;
  };
  const ab = getBigrams(a), bb = getBigrams(b);
  const intersection = ab.filter(bg => bb.includes(bg)).length;
  return (2 * intersection) / (ab.length + bb.length);
}

// So'zni qanchalik mos kelishini hisoblash (0..1)
export function wordMatch(query: string, target: string): number {
  const q = normalizeUz(query);
  const t = normalizeUz(target);

  // To'liq mos
  if (t.includes(q)) return 1.0;
  if (q.includes(t)) return 0.95;

  const qWords = q.split(' ').filter(Boolean);
  const tWords = t.split(' ').filter(Boolean);

  let totalScore = 0;
  for (const qw of qWords) {
    if (qw.length < 2) continue;
    let best = 0;
    for (const tw of tWords) {
      if (tw.length < 2) continue;
      // Substring tekshirish
      if (tw.includes(qw) || qw.includes(tw)) { best = Math.max(best, 0.9); continue; }
      // Levenshtein — qisqa so'zlarda
      const maxLen = Math.max(qw.length, tw.length);
      const lev = levenshtein(qw, tw);
      const levScore = 1 - lev / maxLen;
      // Bigram o'xshashligi
      const bg = bigramSim(qw, tw);
      best = Math.max(best, levScore * 0.5 + bg * 0.5);
    }
    totalScore += best;
  }
  return qWords.length > 0 ? totalScore / qWords.length : 0;
}

// Qidiruvni baholash — listing uchun (yuqori = yaxshiroq)
export function scoreSearch(query: string, fields: string[]): number {
  const q = normalizeUz(query);
  if (!q) return 0;
  let best = 0;
  for (const field of fields) {
    if (!field) continue;
    const score = wordMatch(q, field);
    best = Math.max(best, score);
  }
  return best;
}

export const FUZZY_THRESHOLD = 0.45; // minimum ball
