export type Player = {
  id: string;
  displayName: string;
  aliases: string[];
  status: "active" | "left" | "pending_debut" | "emergency_sub";
  joinedJornada: number | null;
  tags: string[];
  /** Ruta a public/hall-of-fame/<id>.jpg — si existe en disco, se usa en vez de /animations/<id>.jpg. */
  hofPhoto?: string | null;
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

/** Un partido dentro de una jornada. La mayoría de jornadas tienen 1; una jornada
    de ida y vuelta tiene 2 (uno por `leg`). */
export type Partido = {
  leg?: "ida" | "vuelta" | null;
  homeTeam: Team;
  awayTeam: Team;
  result: { home: number; away: number };
  goals: Goal[];
  mvps: MVP[];
  /** Qué falta por rellenar de este partido concreto (se completa editando el JSON). */
  pending?: { goals?: boolean; minutes?: boolean; note?: string } | null;
};

/** Cómo se resuelve una jornada cuyo agregado global queda empatado (p.ej. ida+vuelta 13-13). */
export type TieResolution = {
  status: "tied_points_split" | "pending";
  /** Puntos que recibe cada jugador que participó en algún partido de la jornada. */
  pointsEach: number;
  note?: string;
};

export type Jornada = {
  number: number;
  /** Opcional: puede no conocerse todavía. */
  date?: string | null;
  narrative: string | null;
  /**
   * Forma nueva (temporadas con más de un partido por jornada, p.ej. ida y vuelta).
   * Si no está presente, se sintetiza un único Partido a partir de los campos planos
   * de abajo — usar siempre `getPartidos(j)` de lib/jornada-helpers.ts, nunca estos
   * campos directamente.
   */
  partidos?: Partido[];
  tieResolution?: TieResolution | null;
  /** Forma heredada (T1): partido único. Opcionales porque `partidos` puede sustituirlos. */
  homeTeam?: Team;
  awayTeam?: Team;
  result?: { home: number; away: number };
  goals?: Goal[];
  mvps?: MVP[];
  episode: { youtubeId?: string | null; title: string; description: string; thumbnail: string };
};

export type KeeperRaw = { playerId: string; pj: number; conceded: number; note?: string };

export type StandingResult = "W" | "L" | "T";

export type RankingsData = {
  goleadores: { playerId: string; goals: number }[];
  asistencias: { playerId: string; assists: number }[];
  keepers: KeeperRaw[];
  globalRanking: { playerId: string; score: number; votes: number; totalCaptains: number }[];
  standings: { playerId: string; record: (StandingResult | null)[]; points: number; isUnbeaten: boolean }[];
};

export type CelebrationsData = {
  _comment?: string;
  default: { emoji: string; style: string; media: string | null };
  players: Record<string, { media?: string | null }>;
};

export type CardStat = { k: string; label: string; v: number };

export type FullProfile = {
  id: string; name: string; status: string; pos: string; ovr: number; edition: string; number: number | string;
  video: string | null; poster: string | null;
  goals: number; assists: number; played: number; wins: number; losses: number; points: number;
  goalsRank: number | null; assistsRank: number | null; pointsRank: number | null; keeperRank: number | null;
  ranking: number | null; rankPos: number | null; rankVotes: number;
  oro: number; unbeaten: boolean; keeper: { pj: number; conceded: number; avg: number; classified: boolean; note?: string } | null; joined: number | null;
  form: string[]; cardStats: CardStat[];
  history: { n: number; res: "W" | "L" | "T"; team: string; opp: string; score: string; g: number; a: number; oro: boolean; cumP: number }[];
  chem: { id: string; name: string; w: number; l: number }[];
};
