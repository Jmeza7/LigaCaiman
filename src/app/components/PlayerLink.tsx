import Link from "next/link";
import { getPlayer } from "@/lib/stats";

export function PlayerBadge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      style={{ background: color + "22", color, border: `1px solid ${color}55` }}
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
    >
      {children}
    </span>
  );
}

/** Player name that links to the player's profile, with status/tag badges. */
export function PlayerName({
  id,
  badges = true,
  className = "",
}: {
  id: string;
  badges?: boolean;
  className?: string;
}) {
  const p = getPlayer(id);
  const name = p?.displayName ?? id;
  // ximena and other non-roster ids: render plain text, no link
  if (!p) return <span className={className}>{name}</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      <Link
        href={`/jugador/${id}`}
        className="font-semibold hover:text-[var(--color-accent)] transition-colors underline-offset-2 hover:underline"
      >
        {name}
      </Link>
      {badges && p.status === "emergency_sub" && <PlayerBadge color="#a855f7">🛡️ SUPLENTE</PlayerBadge>}
      {badges && p.tags?.includes("unbeaten") && <PlayerBadge color="#F5B43C">★ INVICTO</PlayerBadge>}
      {badges && p.tags?.includes("injury-history") && <span title="Historial de lesiones">🦵</span>}
    </span>
  );
}
