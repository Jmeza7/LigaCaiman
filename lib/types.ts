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

export type KeeperRaw = { playerId: string; pj: number; conceded: number; note?: string };

export type RankingsData = {
  goleadores: { playerId: string; goals: number }[];
  asistencias: { playerId: string; assists: number }[];
  keepers: KeeperRaw[];
  globalRanking: { playerId: string; score: number; votes: number; totalCaptains: number }[];
  standings: { playerId: string; record: ("W" | "L" | null)[]; points: number; isUnbeaten: boolean }[];
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
  history: { n: number; res: "W" | "L"; team: string; opp: string; score: string; g: number; a: number; oro: boolean; cumP: number }[];
  chem: { id: string; name: string; w: number; l: number }[];
};
