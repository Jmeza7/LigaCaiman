import { getPlayer, createSeasonStats } from "@/lib/stats";
import { getSeason, type Season } from "@/lib/seasons";
import { getSeasonBundle } from "@/lib/season-data";
import { rankWithTies } from "@/lib/awards";
import recordsData from "@/data/records.json";

export type AwardWinner = { id: string; name: string };
export type AwardTier = { rank: number; value: number; winners: AwardWinner[] };
export type SeasonAward = {
  key: string;
  label: string;
  icon: string;
  unit: string;
  decimals: number;
  tiers: AwardTier[];
};

export type SeasonRecord = {
  key: string;
  label: string;
  value: string;
  note?: string;
};

export type RecapEpisode = { status: "pending" | "ready"; youtubeId: string | null };

export type SeasonHallOfFame = {
  season: Season;
  champion: SeasonAward;
  pichichi: SeasonAward;
  asistencias: SeasonAward;
  guanteOro: SeasonAward;
  caimanOro: SeasonAward;
  rankingGlobal: SeasonAward;
  records: SeasonRecord[];
  recapEpisode: RecapEpisode;
};

const winner = (id: string): AwardWinner => ({ id, name: getPlayer(id)?.displayName ?? id });

function toAward(
  key: string,
  label: string,
  icon: string,
  unit: string,
  decimals: number,
  tiers: { rank: number; value: number; items: { id: string }[] }[],
  maxRank = 3
): SeasonAward {
  return {
    key,
    label,
    icon,
    unit,
    decimals,
    tiers: tiers
      .filter((t) => t.rank <= maxRank)
      .map((t) => ({ rank: t.rank, value: t.value, winners: t.items.map((i) => winner(i.id)) })),
  };
}

/** Caimanes de Oro (MVP "normal", no honorífico) ganados por cada jugador en la temporada. */
function caimanOroCounts(jornadas: ReturnType<typeof getSeasonBundle>["jornadas"]) {
  const counts: Record<string, number> = {};
  for (const j of jornadas) {
    for (const m of j.mvps) {
      if (m.type !== "normal") continue;
      counts[m.playerId] = (counts[m.playerId] ?? 0) + 1;
    }
  }
  return Object.entries(counts).map(([id, count]) => ({ id, count }));
}

/** Máximo de goles de un jugador en un solo partido, y quién(es) lo lograron. */
function maxGoalsInMatch(jornadas: ReturnType<typeof getSeasonBundle>["jornadas"]) {
  let max = 0;
  let holders: { playerId: string; jornada: number }[] = [];
  for (const j of jornadas) {
    const perPlayer: Record<string, number> = {};
    for (const g of j.goals) {
      if (!g.countsForStats) continue;
      perPlayer[g.scorer] = (perPlayer[g.scorer] ?? 0) + 1;
    }
    for (const [playerId, goals] of Object.entries(perPlayer)) {
      if (goals > max) {
        max = goals;
        holders = [{ playerId, jornada: j.number }];
      } else if (goals === max && max > 0) {
        holders.push({ playerId, jornada: j.number });
      }
    }
  }
  return { max, holders };
}

/** Jornada(s) con más goles totales. */
function jornadaWithMostGoals(jornadas: ReturnType<typeof getSeasonBundle>["jornadas"]) {
  let max = 0;
  let holders: number[] = [];
  for (const j of jornadas) {
    const total = j.result.home + j.result.away;
    if (total > max) {
      max = total;
      holders = [j.number];
    } else if (total === max && max > 0) {
      holders.push(j.number);
    }
  }
  return { max, holders };
}

/**
 * Mayor remontada acabada en victoria: el mayor déficit que remontó el equipo que
 * terminó ganando. Solo se puede calcular en las jornadas con `scoreAfter` gol a
 * gol (J5 en adelante en T1) — se señala el alcance real en la nota.
 */
function biggestComeback(jornadas: ReturnType<typeof getSeasonBundle>["jornadas"]) {
  let best = { deficit: 0, jornada: 0, team: "" as "home" | "away" | "" };
  const scopedJornadas: number[] = [];
  for (const j of jornadas) {
    if (!j.goals.some((g) => g.scoreAfter)) continue;
    scopedJornadas.push(j.number);
    const finalWinner: "home" | "away" | null =
      j.result.home === j.result.away ? null : j.result.home > j.result.away ? "home" : "away";
    if (!finalWinner) continue;
    let maxDeficit = 0;
    for (const g of j.goals) {
      if (!g.scoreAfter) continue;
      const diff = finalWinner === "home" ? g.scoreAfter.away - g.scoreAfter.home : g.scoreAfter.home - g.scoreAfter.away;
      if (diff > maxDeficit) maxDeficit = diff;
    }
    if (maxDeficit > best.deficit) best = { deficit: maxDeficit, jornada: j.number, team: finalWinner };
  }
  return { best, scopedJornadas };
}

export function buildSeasonHallOfFame(seasonId: string): SeasonHallOfFame | null {
  const season = getSeason(seasonId);
  if (!season) return null;

  const bundle = getSeasonBundle(season.dataDir);
  const stats = createSeasonStats(bundle, season.config);
  const { jornadas, rankings: rankingsData } = bundle;

  const championTiers = rankWithTies(rankingsData.standings, (s) => s.points);
  const champion = toAward("champion", "Campeón", "👑", "pts", 0, championTiers.map((t) => ({ ...t, items: t.items.map((i) => ({ id: i.playerId })) })));

  const pichichiTiers = rankWithTies(stats.computeGoalscorers(), (g) => g.goals);
  const pichichi = toAward("pichichi", "Pichichi", "⚽", "goles", 0, pichichiTiers.map((t) => ({ ...t, items: t.items.map((i) => ({ id: i.id })) })));

  const asistTiers = rankWithTies(stats.computeAssists(), (a) => a.assists);
  const asistencias = toAward("asistencias", "Máximo asistente", "🎯", "asist.", 0, asistTiers.map((t) => ({ ...t, items: t.items.map((i) => ({ id: i.id })) })));

  const classifiedKeepers = stats.classifiedKeeperRanking();
  const guanteTiers = rankWithTies(classifiedKeepers, (k) => k.adj, "asc");
  const guanteOro = toAward("guanteOro", "Guante de Oro", "🧤", "aj.", 2, guanteTiers.map((t) => ({ ...t, items: t.items.map((i) => ({ id: i.id })) })));

  const caimanTiers = rankWithTies(caimanOroCounts(jornadas), (c) => c.count);
  const caimanOro = toAward("caimanOro", "Más Caimanes de Oro", "🐊", "veces", 0, caimanTiers.map((t) => ({ ...t, items: t.items.map((i) => ({ id: i.id })) })));

  const rankingTiers = rankWithTies(rankingsData.globalRanking, (r) => r.score);
  const rankingGlobal = toAward("rankingGlobal", "Ranking Global nº1", "📊", "pts", 1, rankingTiers.map((t) => ({ ...t, items: t.items.map((i) => ({ id: i.playerId })) })));

  const records: SeasonRecord[] = [];
  const mg = maxGoalsInMatch(jornadas);
  if (mg.max > 0) {
    records.push({
      key: "maxGoalsInMatch",
      label: "Más goles en un partido",
      value: `${mg.max} goles`,
      note: mg.holders.map((h) => `${getPlayer(h.playerId)?.displayName ?? h.playerId} · J${h.jornada}`).join(" · "),
    });
  }
  const mj = jornadaWithMostGoals(jornadas);
  if (mj.max > 0) {
    records.push({
      key: "jornadaWithMostGoals",
      label: "Jornada con más goles",
      value: `${mj.max} goles`,
      note: mj.holders.map((n) => `J${n}`).join(" · "),
    });
  }
  const { best: comeback, scopedJornadas } = biggestComeback(jornadas);
  if (comeback.deficit > 0) {
    const teamName = comeback.team === "home" ? "local" : "visitante";
    records.push({
      key: "biggestComeback",
      label: "Mayor remontada",
      value: `${comeback.deficit} goles de diferencia · J${comeback.jornada}`,
      note: `Remontada del equipo ${teamName} que acabó ganando · calculado solo sobre las jornadas con marcador en vivo (${scopedJornadas.map((n) => `J${n}`).join(", ")})`,
    });
  }

  const recapEpisode = ((recordsData as unknown as Record<string, { seasonRecapEpisode: RecapEpisode }>)[season.id]?.seasonRecapEpisode) ?? {
    status: "pending",
    youtubeId: null,
  };

  return { season, champion, pichichi, asistencias, guanteOro, caimanOro, rankingGlobal, records, recapEpisode };
}
