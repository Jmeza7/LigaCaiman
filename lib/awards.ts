/** Agrupa filas en "tiers" por valor, para poder mostrar 1 ganador o varios empatados sin casos especiales. */
export type RankTier<T> = { rank: number; value: number; items: T[] };

export function rankWithTies<T>(
  rows: T[],
  valueOf: (r: T) => number,
  dir: "desc" | "asc" = "desc"
): RankTier<T>[] {
  if (rows.length === 0) return [];
  const sorted = [...rows].sort((a, b) => (dir === "desc" ? valueOf(b) - valueOf(a) : valueOf(a) - valueOf(b)));
  const tiers: RankTier<T>[] = [];
  let rank = 1;
  let i = 0;
  while (i < sorted.length) {
    const value = valueOf(sorted[i]);
    const items: T[] = [];
    while (i < sorted.length && valueOf(sorted[i]) === value) {
      items.push(sorted[i]);
      i++;
    }
    tiers.push({ rank, value, items });
    rank += items.length;
  }
  return tiers;
}
