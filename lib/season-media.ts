import fs from "node:fs";
import path from "node:path";

const PUBLIC_DIR = path.join(process.cwd(), "public");

function firstExisting(candidates: string[]): string | null {
  for (const rel of candidates) {
    if (fs.existsSync(path.join(PUBLIC_DIR, rel))) return `/${rel}`;
  }
  return null;
}

export type JornadaMedia = {
  /** Poster de la jornada, p.ej. para la cabecera de /jornadas/[n] (public/jornadas/...). */
  poster: string | null;
  /** Audio ambiente opcional de la jornada (public/jornadas/....mp3). */
  audio: string | null;
  /** Vídeo de fondo del hero del home (public/videos/....mp4). */
  heroVideo: string | null;
  /** Poster del vídeo de fondo del hero (public/videos/....jpg). */
  heroPoster: string | null;
};

/**
 * Resuelve los assets de una jornada comprobando si existen de verdad en disco,
 * para que una jornada sin media (p.ej. la J9 hoy) degrade con elegancia en vez
 * de romper o enseñar el archivo de otra jornada.
 *
 * Convención de nombres: la Temporada 1 usa el nombre heredado "jornadaN" (no se
 * renombra nada existente). A partir de la Temporada 2, los assets nuevos deben
 * nombrarse "t{season}-jornadaN" para no chocar con los nombres de T1 cuando una
 * temporada futura llegue también a su jornada 1, 2, 3...
 *
 * Server-only (usa fs) — no importar desde un componente "use client".
 */
export function resolveJornadaMedia(seasonNumber: number, jornadaNumber: number): JornadaMedia {
  const base = seasonNumber === 1 ? `jornada${jornadaNumber}` : `t${seasonNumber}-jornada${jornadaNumber}`;
  return {
    poster: firstExisting([`jornadas/${base}.png`, `jornadas/${base}.jpeg`, `jornadas/${base}.jpg`]),
    audio: firstExisting([`jornadas/${base}.mp3`]),
    heroVideo: firstExisting([`videos/${base}.mp4`]),
    heroPoster: firstExisting([`videos/${base}.jpg`, `videos/${base}.jpeg`, `videos/${base}.png`]),
  };
}
