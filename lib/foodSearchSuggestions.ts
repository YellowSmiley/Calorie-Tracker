const MAX_SUGGESTIONS = 5;

export function normalizeForComparison(value: string): string {
  return value.trim().toLowerCase();
}

// Damerau-Levenshtein distance catches common adjacent transposition typos.
export function damerauLevenshtein(a: string, b: string): number {
  const left = normalizeForComparison(a);
  const right = normalizeForComparison(b);

  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );

      if (
        i > 1 &&
        j > 1 &&
        left[i - 1] === right[j - 2] &&
        left[i - 2] === right[j - 1]
      ) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
      }
    }
  }

  return matrix[left.length][right.length];
}

export function scoreSuggestion(search: string, name: string): number {
  const normalizedSearch = normalizeForComparison(search);
  const normalizedName = normalizeForComparison(name);
  const distance = damerauLevenshtein(normalizedSearch, normalizedName);

  // Prioritize prefix/contains and shorter names when distances are tied.
  const startsWithBonus = normalizedName.startsWith(normalizedSearch) ? -1 : 0;
  const containsBonus =
    startsWithBonus === 0 && normalizedName.includes(normalizedSearch)
      ? -0.5
      : 0;

  return (
    distance + startsWithBonus + containsBonus + normalizedName.length * 0.001
  );
}

export function findCloseFoodSuggestions(
  search: string,
  candidates: string[],
): string[] {
  const normalizedSearch = normalizeForComparison(search);
  if (!normalizedSearch || normalizedSearch.length < 2 || !candidates.length) {
    return [];
  }

  return candidates
    .map((name) => ({
      name,
      score: scoreSuggestion(normalizedSearch, name),
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, MAX_SUGGESTIONS)
    .map((entry) => entry.name);
}

function getNameRelevanceRank(search: string, name: string): number {
  const normalizedSearch = normalizeForComparison(search);
  const normalizedName = normalizeForComparison(name);

  if (!normalizedSearch) return 0;
  if (normalizedName === normalizedSearch) return 0;
  if (normalizedName.startsWith(normalizedSearch)) return 1;

  const containsIndex = normalizedName.indexOf(normalizedSearch);
  if (containsIndex >= 0) {
    return (
      2 +
      containsIndex / 100 +
      Math.abs(normalizedName.length - normalizedSearch.length) / 1000
    );
  }

  return 10 + damerauLevenshtein(normalizedSearch, normalizedName);
}

export function sortByRelevanceAndUsage<
  T extends { name: string; usageCount: number },
>(items: T[], search: string): T[] {
  return [...items].sort((a, b) => {
    const relevanceDelta =
      getNameRelevanceRank(search, a.name) -
      getNameRelevanceRank(search, b.name);
    if (relevanceDelta !== 0) return relevanceDelta;

    const usageDelta = b.usageCount - a.usageCount;
    if (usageDelta !== 0) return usageDelta;

    return a.name.localeCompare(b.name);
  });
}
