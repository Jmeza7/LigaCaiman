import type { Metadata } from "next";
import Link from "next/link";
import { getAllSeasons } from "@/lib/seasons";
import { getSeasonBundle } from "@/lib/season-data";

export const metadata: Metadata = {
  title: "Temporadas — Liga Caimán",
  description: "Historial de temporadas de la Liga Caimán.",
};

export default function TemporadasPage() {
  const seasons = getAllSeasons();

  return (
    <div className="lc-container" style={{ paddingBottom: 44 }}>
      <header className="phero">
        <h1 className="big gradient-text">Temporadas</h1>
        <div className="sub">El historial completo de la Liga Caimán, temporada a temporada</div>
      </header>

      <div className="standings">
        {seasons.map((s) => {
          const bundle = getSeasonBundle(s.dataDir);
          const jornadaCount = bundle.jornadas.length;
          const archived = s.status === "archivada";
          const href = archived ? `/temporadas/${s.number}` : "/";
          return (
            <Link key={s.id} href={href} className="statrow">
              <div className="rk">{s.number}</div>
              <div className="who">
                <span className="nm">{s.name}</span>
                <span className={`tag ${archived ? "pending" : "live"}`}>{archived ? "Archivada" : "En curso"}</span>
              </div>
              <div className="track" />
              <div className="v">{jornadaCount}<small>jornadas</small></div>
            </Link>
          );
        })}
      </div>
      <div className="table-note">
        Toca una temporada archivada para ver sus jornadas y tablas en modo solo lectura ·{" "}
        <Link href="/hall-of-fame" style={{ color: "var(--cyan)" }}>Ver Hall of Fame →</Link>
      </div>
    </div>
  );
}
