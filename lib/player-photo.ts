import fs from "node:fs";
import path from "node:path";
import { getPlayer } from "@/lib/stats";

const PUBLIC_DIR = path.join(process.cwd(), "public");

function existsInPublic(relPath: string): boolean {
  return fs.existsSync(path.join(PUBLIC_DIR, relPath));
}

/**
 * Resuelve la foto de un jugador: si `hofPhoto` existe en players.json Y el
 * archivo existe de verdad en disco, se usa; si no, cae a /animations/<id>.jpg
 * si existe; si no hay nada, null (el caller debe mostrar un avatar de
 * iniciales en vez de romper con una imagen rota). Server-only (usa fs).
 */
export function resolvePlayerPhoto(id: string): string | null {
  const player = getPlayer(id);
  const hof = player?.hofPhoto;
  if (hof) {
    const rel = hof.replace(/^\//, "");
    if (existsInPublic(rel)) return `/${rel}`;
  }
  const animRel = `animations/${id}.jpg`;
  if (existsInPublic(animRel)) return `/${animRel}`;
  return null;
}
