import playersData from "@/data/players.json";
import jornadasData from "@/data/jornadas.json";
import rankingsData from "@/data/rankings.json";
import celebrationsData from "@/data/celebrations.json";

export type Player = {
  id: string;
  displayName: string;
  aliases: string[];
  status: "active" | "left" | "pending_debut" | "emergency_sub";
  joinedJornada: number | null;
  tags: string[];
};

export type Goal = {
  minute?: string;
  scorer: string;
  assist?: string | null;
  scoredAgainst?: string | null;
  team: "home" | "away";
  scoreAfter?: { home: number; away: number };
  countsForStats: boolean;
  countsForKeeper: boolean;
  note?: string;
};

export type MVP = {
  playerId: string;
  type: "normal" | "honorary";
  notes?: string;
};

export type Team = {
  name: string;
  captain: string;
  players: string[];
  colors: { primary: string; secondary: string };
};

export type Jornada = {
  number: number;
  date: string;
  narrative: string | null;
  homeTeam: Team;
  awayTeam: Team;
  result: { home: number; away: number };
  goals: Goal[];
  mvps: MVP[];
  episode: { youtubeId?: string | null; title: string; description: string; thumbnail: string };
};

export const players = playersData as Player[];
export const jornadas = jornadasData as unknown as Jornada[];

export function getPlayer(id: string): Player | undefined {
  return players.find((p) => p.id === id);
}

// Goleadores y asistencias son DATO AUTORITATIVO en rankings.json (no se calculan
// desde jornadas.json, porque las asistencias por gol de J1-J4 no son fiables).
export function computeGoalscorers() {
  return (rankingsData.goleadores as { playerId: string; goals: number }[])
    .map((g) => ({ id: g.playerId, goals: g.goals }))
    .sort((a, b) => b.goals - a.goals);
}

export function computeAssists() {
  return (rankingsData.asistencias as { playerId: string; assists: number }[])
    .map((a) => ({ id: a.playerId, assists: a.assists }))
    .sort((a, b) => b.assists - a.assists);
}

export function computeKeepers() {
  const map: Record<string, { conceded: number; played: number }> = {};
  for (const j of jornadas) {
    for (const g of j.goals) {
      if (!g.scoredAgainst || !g.countsForKeeper) continue;
      if (!map[g.scoredAgainst]) map[g.scoredAgainst] = { conceded: 0, played: 0 };
      map[g.scoredAgainst].conceded += 1;
    }
    // count keeper appearances per jornada
    const keepersSeen = new Set<string>();
    for (const g of j.goals) {
      if (g.scoredAgainst && !keepersSeen.has(g.scoredAgainst)) {
        keepersSeen.add(g.scoredAgainst);
        if (!map[g.scoredAgainst]) map[g.scoredAgainst] = { conceded: 0, played: 0 };
        map[g.scoredAgainst].played += 1;
      }
    }
  }
  return Object.entries(map)
    .map(([id, { conceded, played }]) => ({ id, conceded, played, avg: conceded / played }))
    .sort((a, b) => a.avg - b.avg);
}

export function computeMVPs() {
  const mvps: Array<{ playerId: string; jornada: number; type: string; notes?: string }> = [];
  for (const j of jornadas) {
    for (const m of j.mvps) {
      mvps.push({ ...m, jornada: j.number });
    }
  }
  return mvps;
}

/** Cumulative goals per jornada (length = jornadas.length). */
export function cumulativeGoals(id: string): number[] {
  let acc = 0;
  return jornadas.map((j) => {
    acc += j.goals.filter((g) => g.countsForStats && g.scorer === id).length;
    return acc;
  });
}

/** Cumulative assists per jornada. */
export function cumulativeAssists(id: string): number[] {
  let acc = 0;
  return jornadas.map((j) => {
    acc += j.goals.filter((g) => g.countsForStats && g.assist === id && g.assist !== g.scorer).length;
    return acc;
  });
}

/** Cumulative points (3 per win) per jornada, from standings record. */
export function cumulativePoints(id: string): number[] {
  const row = rankingsData.standings.find((s) => s.playerId === id);
  if (!row) return jornadas.map(() => 0);
  let acc = 0;
  return row.record.map((r) => {
    if (r === "W") acc += 3;
    return acc;
  });
}

/** Goles totales por jornada + media de la liga + % vs media. */
export function jornadaStats(n: number) {
  const totals = jornadas.map((j) => j.result.home + j.result.away);
  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
  const j = jornadas.find((x) => x.number === n);
  const total = j ? j.result.home + j.result.away : 0;
  const pct = Math.round(((total - avg) / avg) * 100);
  return { total, avg: Math.round(avg * 10) / 10, pct };
}

/** Puntos acumulados de un jugador tras la jornada k (de standings.record). */
function pointsAfter(playerId: string, k: number): number {
  const row = rankingsData.standings.find((s) => s.playerId === playerId);
  if (!row) return 0;
  let pts = 0;
  for (let i = 0; i < k && i < row.record.length; i++) if (row.record[i] === "W") pts += 3;
  return pts;
}

function rankingAfter(k: number) {
  return rankingsData.standings
    .map((s) => ({ id: s.playerId, pts: pointsAfter(s.playerId, k) }))
    .sort((a, b) => b.pts - a.pts || (getPlayer(a.id)?.displayName ?? "").localeCompare(getPlayer(b.id)?.displayName ?? ""));
}

/** Top 5 tras la jornada n con cambio de posición (delta) respecto a la anterior. */
export function top5After(n: number) {
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

export type PlayerProfile = {
  player: Player;
  jornadasPlayed: number;
  goals: number;
  goalsRank: number | null;
  assists: number;
  assistsRank: number | null;
  wins: number;
  losses: number;
  points: number;
  captaincies: { jornada: number; teamName: string; won: boolean }[];
  mvps: { jornada: number; type: string }[];
  keeper: { played: number; conceded: number; avg: number } | null;
  global: { score: number; rank: number; votes: number; totalCaptains: number } | null;
  history: {
    jornada: number;
    date: string;
    teamName: string;
    opponentName: string;
    won: boolean;
    goals: number;
    assists: number;
    wasCaptain: boolean;
    wasMVP: boolean;
    narrative: string | null;
  }[];
};

/* =========================================================
   PERFIL COMPLETO (cromo FIFA, OVR, química, etc.)
   ========================================================= */
const clamp = (v: number) => Math.max(1, Math.min(99, Math.round(v)));
const celMedia = (id: string): boolean =>
  !!(celebrationsData as { players: Record<string, { media?: string | null }> }).players[id]?.media;

type KeeperRaw = { playerId: string; pj: number; conceded: number; note?: string };

/** Bonus por volumen: cada PJ extra (más allá del 1º) baja la media efectiva.
   Premia a los porteros que más han jugado. */
export const KEEPER_VOLUME_BONUS = 0.3;
/** Media ajustada por volumen = encajados/PJ − bonus·(PJ−1). Menos es mejor. */
export function keeperAdjusted(conceded: number, pj: number): number {
  return conceded / pj - KEEPER_VOLUME_BONUS * (pj - 1);
}
/** PJ mínimos para clasificar en la tabla principal de porteros. */
export const KEEPER_MIN_PJ = 2;

/** Porteros clasificados (PJ >= mínimo) ordenados por media AJUSTADA asc — para ranking. */
function classifiedKeeperRanking() {
  return (rankingsData.keepers as KeeperRaw[])
    .filter((k) => k.pj >= KEEPER_MIN_PJ)
    .map((k) => ({ id: k.playerId, adj: keeperAdjusted(k.conceded, k.pj) }))
    .sort((a, b) => a.adj - b.adj);
}

type Basics = {
  goals: number; assists: number; played: number; wins: number; losses: number; points: number;
  ranking: number | null; rankPos: number | null; rankVotes: number;
  oro: number; unbeaten: boolean; keeper: { pj: number; conceded: number; avg: number; classified: boolean; note?: string } | null;
  joined: number | null;
};

function computeBasics(id: string): Basics {
  // goles/asistencias = dato autoritativo (rankings.json), no recuento de goles
  const goals = (rankingsData.goleadores as { playerId: string; goals: number }[]).find((g) => g.playerId === id)?.goals ?? 0;
  const assists = (rankingsData.asistencias as { playerId: string; assists: number }[]).find((a) => a.playerId === id)?.assists ?? 0;
  let played = 0, wins = 0, losses = 0, oro = 0;
  for (const j of jornadas) {
    const onHome = j.homeTeam.players.includes(id);
    const onAway = j.awayTeam.players.includes(id);
    if (onHome || onAway) {
      played++;
      const won = onHome ? j.result.home > j.result.away : j.result.away > j.result.home;
      if (won) wins++; else losses++;
    }
    for (const m of j.mvps) if (m.playerId === id && m.type === "normal") oro++;
  }
  const gIdx = rankingsData.globalRanking.findIndex((r) => r.playerId === id);
  const gEntry = gIdx >= 0 ? rankingsData.globalRanking[gIdx] : null;
  const standing = rankingsData.standings.find((s) => s.playerId === id);
  const keeperData = (rankingsData.keepers as KeeperRaw[]).find((k) => k.playerId === id);
  return {
    goals, assists, played, wins, losses, points: wins * 3,
    ranking: gEntry ? gEntry.score : null,
    rankPos: gIdx >= 0 ? gIdx + 1 : null,
    rankVotes: gEntry ? gEntry.votes : 0,
    oro,
    unbeaten: !!standing?.isUnbeaten,
    keeper: keeperData
      ? { pj: keeperData.pj, conceded: keeperData.conceded, avg: keeperData.conceded / keeperData.pj, classified: keeperData.pj >= KEEPER_MIN_PJ, note: keeperData.note }
      : null,
    joined: getPlayer(id)?.joinedJornada ?? null,
  };
}

export type CardStat = { k: string; label: string; v: number };

export function cardStatsFor(id: string): { cardStats: CardStat[]; ovr: number } {
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

export type FullProfile = {
  id: string; name: string; status: string; pos: string; ovr: number; edition: string; number: number | string;
  video: string | null; poster: string | null;
  goals: number; assists: number; played: number; wins: number; losses: number; points: number;
  goalsRank: number | null; assistsRank: number | null; pointsRank: number | null; keeperRank: number | null;
  ranking: number | null; rankPos: number | null; rankVotes: number;
  oro: number; unbeaten: boolean; keeper: { pj: number; conceded: number; avg: number; classified: boolean; note?: string } | null; joined: number | null;
  form: string[]; cardStats: CardStat[];
  history: { n: number; res: "W" | "L"; team: string; opp: string; score: string; g: number; a: number; oro: boolean; cumP: number }[];
  chem: { id: string; name: string; w: number; l: number }[];
};

export function buildFullProfile(id: string): FullProfile | null {
  const player = getPlayer(id);
  if (!player) return null;
  const b = computeBasics(id);
  const { cardStats, ovr } = cardStatsFor(id);

  const pos = b.keeper ? "POR" : b.goals >= b.assists ? "DEL" : "MC";
  const edition = b.oro > 0 && b.goals >= 12 ? "PICHICHI" : b.oro > 0 ? "MVP" : b.unbeaten ? "INVICTO" : "OFICIAL";

  const standing = rankingsData.standings.find((s) => s.playerId === id);
  const form = standing ? standing.record.map((r) => (r === "W" ? "W" : r === "L" ? "L" : "N")) : jornadas.map(() => "N");

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
    const onHome = j.homeTeam.players.includes(id);
    const onAway = j.awayTeam.players.includes(id);
    if (!onHome && !onAway) continue;
    const team = onHome ? j.homeTeam : j.awayTeam;
    const opp = onHome ? j.awayTeam : j.homeTeam;
    const won = onHome ? j.result.home > j.result.away : j.result.away > j.result.home;
    if (won) cumP += 3;
    const g = j.goals.filter((x) => x.countsForStats && x.scorer === id).length;
    const a = j.goals.filter((x) => x.countsForStats && x.assist === id && x.assist !== x.scorer).length;
    const oro = j.mvps.some((m) => m.playerId === id && m.type === "normal");
    history.push({
      n: j.number,
      res: won ? "W" : "L",
      team: team.name,
      opp: opp.name,
      score: `${onHome ? j.result.home : j.result.away}-${onHome ? j.result.away : j.result.home}`,
      g, a, oro, cumP,
    });
    for (const mate of team.players) {
      if (mate === id) continue;
      if (!chemMap[mate]) chemMap[mate] = { w: 0, l: 0 };
      if (won) chemMap[mate].w++; else chemMap[mate].l++;
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
export function playerOrder(): { id: string; name: string; rankPos: number | null }[] {
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

export function getPlayerProfile(id: string): PlayerProfile | null {
  const player = getPlayer(id);
  if (!player) return null;

  const goalsRanking = computeGoalscorers();
  const assistsRanking = computeAssists();
  const goalsRankIdx = goalsRanking.findIndex((g) => g.id === id);
  const assistsRankIdx = assistsRanking.findIndex((a) => a.id === id);

  let wins = 0;
  let losses = 0;
  const captaincies: PlayerProfile["captaincies"] = [];
  const mvpList: PlayerProfile["mvps"] = [];
  const history: PlayerProfile["history"] = [];

  for (const j of jornadas) {
    const onHome = j.homeTeam.players.includes(id);
    const onAway = j.awayTeam.players.includes(id);
    if (!onHome && !onAway) continue;

    const team = onHome ? j.homeTeam : j.awayTeam;
    const opponent = onHome ? j.awayTeam : j.homeTeam;
    const won = onHome ? j.result.home > j.result.away : j.result.away > j.result.home;
    if (won) wins++;
    else losses++;

    const wasCaptain = team.captain === id;
    if (wasCaptain) captaincies.push({ jornada: j.number, teamName: team.name, won });

    const wasMVP = j.mvps.some((m) => m.playerId === id);
    for (const m of j.mvps) if (m.playerId === id) mvpList.push({ jornada: j.number, type: m.type });

    const jGoals = j.goals.filter((g) => g.countsForStats && g.scorer === id).length;
    const jAssists = j.goals.filter((g) => g.countsForStats && g.assist === id).length;

    history.push({
      jornada: j.number,
      date: j.date,
      teamName: team.name,
      opponentName: opponent.name,
      won,
      goals: jGoals,
      assists: jAssists,
      wasCaptain,
      wasMVP,
      narrative: j.narrative,
    });
  }

  const keeperData = rankingsData.keepers.find((k) => k.playerId === id);
  const globalIdx = rankingsData.globalRanking.findIndex((g) => g.playerId === id);
  const globalEntry = globalIdx >= 0 ? rankingsData.globalRanking[globalIdx] : null;

  return {
    player,
    jornadasPlayed: history.length,
    goals: goalsRankIdx >= 0 ? goalsRanking[goalsRankIdx].goals : 0,
    goalsRank: goalsRankIdx >= 0 ? goalsRankIdx + 1 : null,
    assists: assistsRankIdx >= 0 ? assistsRanking[assistsRankIdx].assists : 0,
    assistsRank: assistsRankIdx >= 0 ? assistsRankIdx + 1 : null,
    wins,
    losses,
    points: wins * 3,
    captaincies,
    mvps: mvpList,
    keeper: keeperData
      ? { played: keeperData.pj, conceded: keeperData.conceded, avg: keeperData.conceded / keeperData.pj }
      : null,
    global: globalEntry
      ? { score: globalEntry.score, rank: globalIdx + 1, votes: globalEntry.votes, totalCaptains: globalEntry.totalCaptains }
      : null,
    history: history.sort((a, b) => b.jornada - a.jornada),
  };
}
