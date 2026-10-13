import playersData from "@/data/players.json";
import type { SeasonBundle } from "@/lib/season-data";
import type { SeasonConfig } from "@/lib/seasons";
import type { Player, Goal, MVP, Team, Jornada, CardStat, FullProfile, KeeperRaw } from "@/lib/types";
import { allGoalsIn, allMvpsIn, jornadaTotalGoals, outcomeFor, jornadaTeamsSummary } from "@/lib/jornada-helpers";

export type { Player, Goal, MVP, Team, Jornada, CardStat, FullProfile };

export const players = playersData as Player[];

export function getPlayer(id: string): Player | undefined {
  return players.find((p) => p.id === id);
}

/** Bonus por volumen: cada PJ extra (más allá del 1º) baja la media efectiva.
   Premia a los porteros que más han jugado. */
export const KEEPER_VOLUME_BONUS = 0.3;
/** Media ajustada por volumen = encajados/PJ − bonus·(PJ−1). Menos es mejor. */
export function keeperAdjusted(conceded: number, pj: number): number {
  return conceded / pj - KEEPER_VOLUME_BONUS * (pj - 1);
}
/** PJ mínimos por defecto para clasificar en la tabla principal de porteros,
    si una temporada no define su propio config.keeperMinPJ. */
export const KEEPER_MIN_PJ = 2;

const clamp = (v: number) => Math.max(1, Math.min(99, Math.round(v)));

/* =========================================================
   API de estadísticas atada a UNA temporada (bundle + config).
   Todas las funciones de aquí abajo cierran sobre ese bundle,
   nunca sobre datos de otra temporada.
   ========================================================= */
export function createSeasonStats(bundle: SeasonBundle, config: SeasonConfig) {
  const { jornadas, rankings: rankingsData, celebrations: celebrationsData } = bundle;
  const keeperMinPJ = config.keeperMinPJ ?? KEEPER_MIN_PJ;
  const pointsPerWin = config.pointsPerWin ?? 3;
  const pointsPerTie = config.pointsPerTie ?? 0;

  function computeGoalscorers() {
    return rankingsData.goleadores
      .map((g) => ({ id: g.playerId, goals: g.goals }))
      .sort((a, b) => b.goals - a.goals);
  }

  function computeAssists() {
    return rankingsData.asistencias
      .map((a) => ({ id: a.playerId, assists: a.assists }))
      .sort((a, b) => b.assists - a.assists);
  }

  /** Goles acumulados por jornada (length = jornadas.length). */
  function cumulativeGoals(id: string): number[] {
    let acc = 0;
    return jornadas.map((j) => {
      acc += allGoalsIn(j).filter((g) => g.countsForStats && g.scorer === id).length;
      return acc;
    });
  }

  /** Asistencias acumuladas por jornada. */
  function cumulativeAssists(id: string): number[] {
    let acc = 0;
    return jornadas.map((j) => {
      acc += allGoalsIn(j).filter((g) => g.countsForStats && g.assist === id && g.assist !== g.scorer).length;
      return acc;
    });
  }

  /** Puntos acumulados (pointsPerWin por victoria) por jornada, desde standings.record. */
  function cumulativePoints(id: string): number[] {
    const row = rankingsData.standings.find((s) => s.playerId === id);
    if (!row) return jornadas.map(() => 0);
    let acc = 0;
    return row.record.map((r) => {
      if (r === "W") acc += pointsPerWin;
      else if (r === "T") acc += pointsPerTie;
      return acc;
    });
  }

  /** Goles totales por jornada + media de la liga + % vs media. */
  function jornadaStats(n: number) {
    const totals = jornadas.map((j) => jornadaTotalGoals(j));
    if (totals.length === 0) return { total: 0, avg: 0, pct: 0 };
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    const j = jornadas.find((x) => x.number === n);
    const total = j ? jornadaTotalGoals(j) : 0;
    const pct = avg === 0 ? 0 : Math.round(((total - avg) / avg) * 100);
    return { total, avg: Math.round(avg * 10) / 10, pct };
  }

  /** Puntos acumulados de un jugador tras la jornada k (de standings.record). */
  function pointsAfter(playerId: string, k: number): number {
    const row = rankingsData.standings.find((s) => s.playerId === playerId);
    if (!row) return 0;
    let pts = 0;
    for (let i = 0; i < k && i < row.record.length; i++) {
      if (row.record[i] === "W") pts += pointsPerWin;
      else if (row.record[i] === "T") pts += pointsPerTie;
    }
    return pts;
  }

  function rankingAfter(k: number) {
    return rankingsData.standings
      .map((s) => ({ id: s.playerId, pts: pointsAfter(s.playerId, k) }))
      .sort((a, b) => b.pts - a.pts || (getPlayer(a.id)?.displayName ?? "").localeCompare(getPlayer(b.id)?.displayName ?? ""));
  }

  /** Top 5 tras la jornada n con cambio de posición (delta) respecto a la anterior. */
  function top5After(n: number) {
    const now = rankingAfter(n);
    const prev = rankingAfter(n - 1);
    const prevPos: Record<string, number> = {};
    prev.forEach((p, i) => (prevPos[p.id] = i + 1));
    return now.slice(0, 5).map((p, i) => {
      const newPos = i + 1;
      const hadPoints = pointsAfter(p.id, n - 1) > 0;
      const delta: number | "new" = hadPoints ? prevPos[p.id] - newPos : "new";
      return { id: p.id, name: getPlayer(p.id)?.displayName ?? p.id, pts: p.pts, delta };
    });
  }

  const celMedia = (id: string): boolean => !!celebrationsData.players[id]?.media;

  type Basics = {
    goals: number; assists: number; played: number; wins: number; losses: number; points: number;
    ranking: number | null; rankPos: number | null; rankVotes: number;
    oro: number; unbeaten: boolean; keeper: { pj: number; conceded: number; avg: number; classified: boolean; note?: string } | null;
    joined: number | null;
  };

  function computeBasics(id: string): Basics {
    // goles/asistencias = dato autoritativo (rankings.json de la temporada), no recuento de goles
    const goals = rankingsData.goleadores.find((g) => g.playerId === id)?.goals ?? 0;
    const assists = rankingsData.asistencias.find((a) => a.playerId === id)?.assists ?? 0;
    let played = 0, wins = 0, losses = 0, ties = 0, oro = 0;
    for (const j of jornadas) {
      const { outcome } = outcomeFor(j, id);
      if (outcome) {
        played++;
        if (outcome === "W") wins++;
        else if (outcome === "L") losses++;
        else ties++;
      }
      for (const m of allMvpsIn(j)) if (m.playerId === id && m.type === "normal") oro++;
    }
    const gIdx = rankingsData.globalRanking.findIndex((r) => r.playerId === id);
    const gEntry = gIdx >= 0 ? rankingsData.globalRanking[gIdx] : null;
    const standing = rankingsData.standings.find((s) => s.playerId === id);
    const keeperData = rankingsData.keepers.find((k) => k.playerId === id);
    return {
      goals, assists, played, wins, losses, points: wins * pointsPerWin + ties * pointsPerTie,
      ranking: gEntry ? gEntry.score : null,
      rankPos: gIdx >= 0 ? gIdx + 1 : null,
      rankVotes: gEntry ? gEntry.votes : 0,
      oro,
      unbeaten: !!standing?.isUnbeaten,
      keeper: keeperData
        ? { pj: keeperData.pj, conceded: keeperData.conceded, avg: keeperData.conceded / keeperData.pj, classified: keeperData.pj >= keeperMinPJ, note: keeperData.note }
        : null,
      joined: getPlayer(id)?.joinedJornada ?? null,
    };
  }

  /** Porteros clasificados (PJ >= mínimo de la temporada) ordenados por media AJUSTADA asc — para ranking. */
  function classifiedKeeperRanking() {
    return (rankingsData.keepers as KeeperRaw[])
      .filter((k) => k.pj >= keeperMinPJ)
      .map((k) => ({ id: k.playerId, adj: keeperAdjusted(k.conceded, k.pj) }))
      .sort((a, b) => a.adj - b.adj);
  }

  function cardStatsFor(id: string): { cardStats: CardStat[]; ovr: number } {
    const b = computeBasics(id);
    const winrate = b.played ? b.wins / b.played : 0;
    const rScore = b.ranking ?? 0;
    const GOL = clamp(40 + b.goals * 3.5);
    const ASI = clamp(45 + b.assists * 9);
    const RNK = clamp(b.ranking ?? 40);
    const FRM = clamp(35 + winrate * 60 + (b.unbeaten ? 10 : 0));
    const WIN = clamp(35 + winrate * 64);
    const MVP = clamp(45 + b.oro * 35 + rScore * 0.15);
    const ovr = clamp((GOL + ASI + RNK + FRM + WIN + MVP) / 6 + (b.oro ? 4 : 0));
    return {
      ovr,
      cardStats: [
        { k: "GOL", label: "Goleo", v: GOL },
        { k: "ASI", label: "Asist.", v: ASI },
        { k: "RNK", label: "Ranking", v: RNK },
        { k: "FRM", label: "Forma", v: FRM },
        { k: "WIN", label: "Victorias", v: WIN },
        { k: "MVP", label: "MVP", v: MVP },
      ],
    };
  }

  function buildFullProfile(id: string): FullProfile | null {
    const player = getPlayer(id);
    if (!player) return null;
    const b = computeBasics(id);
    const { cardStats, ovr } = cardStatsFor(id);

    const pos = b.keeper ? "POR" : b.goals >= b.assists ? "DEL" : "MC";
    const edition = b.oro > 0 && b.goals >= 12 ? "PICHICHI" : b.oro > 0 ? "MVP" : b.unbeaten ? "INVICTO" : "OFICIAL";

    const standing = rankingsData.standings.find((s) => s.playerId === id);
    const form = standing
      ? standing.record.map((r) => (r === "W" ? "W" : r === "L" ? "L" : r === "T" ? "T" : "N"))
      : jornadas.map(() => "N");

    // posición en cada tabla
    const gIdx = computeGoalscorers().findIndex((g) => g.id === id);
    const aIdx = computeAssists().findIndex((a) => a.id === id);
    const pIdx = rankingsData.standings.findIndex((s) => s.playerId === id);
    const kIdx = classifiedKeeperRanking().findIndex((k) => k.id === id);

    // history + chemistry
    const history: FullProfile["history"] = [];
    const chemMap: Record<string, { w: number; l: number }> = {};
    let cumP = 0;
    for (const j of jornadas) {
      const { outcome, team, opp } = outcomeFor(j, id);
      if (!outcome || !team || !opp) continue;
      if (outcome === "W") cumP += pointsPerWin;
      else if (outcome === "T") cumP += pointsPerTie;
      const jGoals = allGoalsIn(j);
      const g = jGoals.filter((x) => x.countsForStats && x.scorer === id).length;
      const a = jGoals.filter((x) => x.countsForStats && x.assist === id && x.assist !== x.scorer).length;
      const oro = allMvpsIn(j).some((m) => m.playerId === id && m.type === "normal");
      const { teams } = jornadaTeamsSummary(j);
      const myTeam = teams.find((t) => t.name === team.name);
      const score = myTeam ? `${myTeam.goalsFor}-${myTeam.goalsAgainst}` : "";
      history.push({
        n: j.number,
        res: outcome,
        team: team.name,
        opp: opp.name,
        score,
        g, a, oro, cumP,
      });
      if (outcome !== "T") {
        for (const mate of team.players) {
          if (mate === id) continue;
          if (!chemMap[mate]) chemMap[mate] = { w: 0, l: 0 };
          if (outcome === "W") chemMap[mate].w++; else chemMap[mate].l++;
        }
      }
    }

    const chem = Object.entries(chemMap)
      .map(([mid, rec]) => ({ id: mid, name: getPlayer(mid)?.displayName ?? mid, w: rec.w, l: rec.l }))
      .sort((x, y) => y.w + y.l - (x.w + x.l) || y.w / (y.w + y.l) - x.w / (x.w + x.l))
      .slice(0, 8);

    return {
      id, name: (player.displayName || id).toUpperCase(), status: player.status, pos, ovr, edition,
      number: b.rankPos ?? "—",
      video: celMedia(id) ? `/animations/${id}.mp4` : null,
      poster: celMedia(id) ? `/animations/${id}.jpg` : null,
      goals: b.goals, assists: b.assists, played: b.played, wins: b.wins, losses: b.losses, points: b.points,
      goalsRank: gIdx >= 0 ? gIdx + 1 : null,
      assistsRank: aIdx >= 0 ? aIdx + 1 : null,
      pointsRank: pIdx >= 0 ? pIdx + 1 : null,
      keeperRank: kIdx >= 0 ? kIdx + 1 : null,
      ranking: b.ranking, rankPos: b.rankPos, rankVotes: b.rankVotes,
      oro: b.oro, unbeaten: b.unbeaten, keeper: b.keeper, joined: b.joined,
      form, cardStats, history, chem,
    };
  }

  /** Orden de jugadores: por ranking, luego el resto por nombre. Para el rail/rivales. */
  function playerOrder(): { id: string; name: string; rankPos: number | null }[] {
    return players
      .filter((p) => p.status !== "pending_debut")
      .map((p) => {
        const idx = rankingsData.globalRanking.findIndex((r) => r.playerId === p.id);
        return { id: p.id, name: p.displayName.toUpperCase(), rankPos: idx >= 0 ? idx + 1 : null };
      })
      .sort((a, b) => {
        if (a.rankPos && b.rankPos) return a.rankPos - b.rankPos;
        if (a.rankPos) return -1;
        if (b.rankPos) return 1;
        return a.name.localeCompare(b.name);
      });
  }

  return {
    jornadas,
    rankingsData,
    celebrationsData,
    keeperMinPJ,
    pointsPerWin,
    pointsPerTie,
    computeGoalscorers,
    computeAssists,
    cumulativeGoals,
    cumulativeAssists,
    cumulativePoints,
    jornadaStats,
    top5After,
    classifiedKeeperRanking,
    cardStatsFor,
    buildFullProfile,
    playerOrder,
  };
}

export type SeasonStatsAPI = ReturnType<typeof createSeasonStats>;
