import temporadasData from "@/data/temporadas.json";

export type SeasonConfig = {
  keeperMinPJ: number;
  pointsPerWin: number;
  /** Puntos por jornada empatada con reparto especial (p.ej. ida/vuelta 13-13). Default 0 si no se define. */
  pointsPerTie?: number;
};

export type Season = {
  id: string;
  number: number;
  name: string;
  status: "archivada" | "activa";
  startDate: string | null;
  endDate: string | null;
  dataDir: string;
  config: SeasonConfig;
};

type TemporadasFile = {
  currentSeasonId: string;
  seasons: Season[];
};

const data = temporadasData as unknown as TemporadasFile;

export function getAllSeasons(): Season[] {
  return data.seasons;
}

export function getSeason(id: string): Season | undefined {
  return data.seasons.find((s) => s.id === id);
}

export function getSeasonByNumber(n: number): Season | undefined {
  return data.seasons.find((s) => s.number === n);
}

export function getActiveSeason(): Season {
  const season = getSeason(data.currentSeasonId);
  if (!season) {
    throw new Error(`currentSeasonId "${data.currentSeasonId}" no existe en data/temporadas.json`);
  }
  return season;
}

export function getArchivedSeasons(): Season[] {
  return data.seasons.filter((s) => s.status === "archivada");
}
