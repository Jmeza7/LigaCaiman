import { getPlayer } from "@/lib/stats";
import { resolvePlayerPhoto } from "@/lib/player-photo";

/**
 * Foto de un jugador con fallback a un avatar de iniciales cuando no hay
 * archivo en disco (ni hofPhoto ni /animations/<id>.jpg) — para que un
 * jugador nuevo sin foto no rompa el diseño con una imagen rota.
 * Server component (sin JS, usa fs vía lib/player-photo.ts).
 *
 * Dos modos:
 * - `fill`: ocupa el 100% del contenedor (que debe ser position:relative),
 *   igual que las <img> absolutas que ya usan las tarjetas de líder y MVP.
 * - `size`: avatar circular de tamaño fijo en px (Hall of Fame).
 */
export function PlayerAvatar({
  id,
  size,
  fill,
  className = "",
}: {
  id: string;
  size?: number;
  fill?: boolean;
  className?: string;
}) {
  const name = getPlayer(id)?.displayName ?? id;
  const photo = resolvePlayerPhoto(id);
  const initials = name.slice(0, 2).toUpperCase();

  const style: React.CSSProperties = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }
    : { width: size ?? 48, height: size ?? 48, borderRadius: "50%", objectFit: "cover" };

  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={name} className={className} style={style} />;
  }

  return (
    <div
      className={`pavatar-initials ${className}`}
      style={{ ...style, display: "grid", placeItems: "center", fontSize: (size ?? 48) * 0.36 }}
    >
      <span>{initials}</span>
    </div>
  );
}
