import type { Jornada, RankingsData, CelebrationsData } from "@/lib/types";

import t1Jornadas from "@/data/t1/jornadas.json";
import t1Rankings from "@/data/t1/rankings.json";
import t1Celebrations from "@/data/t1/celebrations.json";
import t2Jornadas from "@/data/t2/jornadas.json";
import t2Rankings from "@/data/t2/rankings.json";
import t2Celebrations from "@/data/t2/celebrations.json";

export type SeasonBundle = {
  jornadas: Jornada[];
  rankings: RankingsData;
  celebrations: CelebrationsData;
};

const BUNDLES: Record<string, SeasonBundle> = {
  t1: {
    jornadas: t1Jornadas as unknown as Jornada[],
    rankings: t1Rankings as RankingsData,
    celebrations: t1Celebrations as CelebrationsData,
  },
  t2: {
    jornadas: t2Jornadas as unknown as Jornada[],
    rankings: t2Rankings as RankingsData,
    celebrations: t2Celebrations as CelebrationsData,
  },
};

/**
 * Para añadir una temporada futura (p.ej. t3): crea data/t3/{jornadas,rankings,celebrations}.json
 * con la misma forma, añade las 3 importaciones de arriba + una entrada en BUNDLES, y una entrada
 * en data/temporadas.json. Import dinámico por plantilla no es seguro con el bundler de Next, por
 * eso cada temporada se importa de forma estática.
 */
export function getSeasonBundle(dataDir: string): SeasonBundle {
  const bundle = BUNDLES[dataDir];
  if (!bundle) throw new Error(`No hay datos cargados para la temporada "${dataDir}" (lib/season-data.ts)`);
  return bundle;
}
