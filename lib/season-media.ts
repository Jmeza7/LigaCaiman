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
  /** Póster del Caimán de Oro de la jornada (p.ej. jornada1-mvp.png), si existe. */
  mvpPoster: string | null;
};

/**
 * Resuelve los assets de una jornada comprobando si existen de verdad en disco,
 * para que una jornada sin media (p.ej. la J9 de T1) degrade con elegancia en
 * vez de romper o enseñar el archivo de otra jornada.
 *
 * Convención de nombres:
 * - Temporada 1 (heredada, no se renombra nada existente):
 *   `public/jornadas/jornadaN.{png,jpeg,jpg}` (poster), `jornadaN.mp3` (audio),
 *   `public/videos/jornadaN.mp4` + `.jpg` (vídeo de fondo del hero + su poster).
 * - Temporada 2 en adelante: todo vive junto en
 *   `public/jornadas/temporada-{season}/`:
 *   `jornada{N}-teams.{jpg,jpeg,png}` (poster — la imagen que sale en la home
 *   y en la cabecera de la jornada), `jornada{N}-tease.{mp4}` (vídeo de fondo
 *   del hero), `jornada{N}.mp3` (audio). Si no hay poster específico del
 *   vídeo, se usa la imagen "teams" como heroPoster.
 *
 * Server-only (usa fs) — no importar desde un componente "use client".
 */
export function resolveJornadaMedia(seasonNumber: number, jornadaNumber: number): JornadaMedia {
  if (seasonNumber === 1) {
    const base = `jornada${jornadaNumber}`;
    return {
      poster: firstExisting([`jornadas/${base}.png`, `jornadas/${base}.jpeg`, `jornadas/${base}.jpg`]),
      audio: firstExisting([`jornadas/${base}.mp3`]),
      heroVideo: firstExisting([`videos/${base}.mp4`]),
      heroPoster: firstExisting([`videos/${base}.jpg`, `videos/${base}.jpeg`, `videos/${base}.png`]),
      mvpPoster: firstExisting([`jornadas/${base}-mvp.png`, `jornadas/${base}-mvp.jpg`, `jornadas/${base}-mvp.jpeg`]),
    };
  }

  const dir = `jornadas/temporada-${seasonNumber}`;
  const teams = firstExisting([`${dir}/jornada${jornadaNumber}-teams.jpg`, `${dir}/jornada${jornadaNumber}-teams.jpeg`, `${dir}/jornada${jornadaNumber}-teams.png`]);
  const tease = firstExisting([`${dir}/jornada${jornadaNumber}-tease.mp4`]);
  const teaseOwnPoster = firstExisting([`${dir}/jornada${jornadaNumber}-tease.jpg`, `${dir}/jornada${jornadaNumber}-tease.jpeg`, `${dir}/jornada${jornadaNumber}-tease.png`]);
  return {
    poster: teams,
    audio: firstExisting([`${dir}/jornada${jornadaNumber}.mp3`]),
    heroVideo: tease,
    heroPoster: teaseOwnPoster ?? teams,
    mvpPoster: firstExisting([`${dir}/jornada${jornadaNumber}-mvp.png`, `${dir}/jornada${jornadaNumber}-mvp.jpg`, `${dir}/jornada${jornadaNumber}-mvp.jpeg`]),
  };
}
