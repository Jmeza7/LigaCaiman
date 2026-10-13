import type { Metadata } from "next";
import Link from "next/link";
import { getArchivedSeasons } from "@/lib/seasons";
import { buildSeasonHallOfFame, type SeasonAward } from "@/lib/hallOfFame";
import { PlayerAvatar } from "@/app/components/PlayerAvatar";

export const metadata: Metadata = {
  title: "Hall of Fame — Liga Caimán",
  description: "Campeones, Pichichis, Guantes de Oro y récords históricos de la Liga Caimán, temporada a temporada.",
};

function AwardBlock({ award }: { award: SeasonAward }) {
  const top = award.tiers.filter((t) => t.rank <= 3);
  if (top.length === 0) return null;
  const first = top[0];
  const rest = top.slice(1);

  return (
    <div className="hof-award">
      <div className="hof-award-h">
        <span className="ic">{award.icon}</span>
        <span className="t">{award.label}</span>
      </div>
      <div className="hof-winners">
        {first.winners.map((w) => (
          <Link key={w.id} href={`/jugador/${w.id}`} className="hof-winner hof-winner-1">
            <PlayerAvatar id={w.id} size={56} />
            <div className="hof-winner-name">{w.name}</div>
            <div className="hof-winner-val">{first.value.toFixed(award.decimals)} {award.unit}</div>
          </Link>
        ))}
      </div>
      {rest.length > 0 && (
        <div className="hof-podium">
          {rest.map((tier) => (
            <div key={tier.rank} className="hof-podium-tier">
              <span className="rk">#{tier.rank}</span>
              {tier.winners.map((w) => (
                <Link key={w.id} href={`/jugador/${w.id}`} className="hof-podium-name">
                  {w.name}
                </Link>
              ))}
              <span className="v">{tier.value.toFixed(award.decimals)} {award.unit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HallOfFamePage() {
  const seasons = getArchivedSeasons();
  const entries = seasons.map((s) => buildSeasonHallOfFame(s.id)).filter((h) => h !== null);

  return (
    <div className="lc-container" style={{ paddingBottom: 44 }}>
      <header className="phero">
        <h1 className="big gradient-text">Hall of Fame</h1>
        <div className="sub">Los campeones, récords y leyendas de cada temporada archivada</div>
      </header>

      {entries.length === 0 ? (
        <div className="panel" style={{ padding: "40px 28px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🐊</div>
          <p style={{ color: "var(--ink-2)" }}>Todavía no hay ninguna temporada archivada.</p>
        </div>
      ) : (
        entries.map((hof) => (
          <section key={hof.season.id} className="hof-card">
            <div className="hof-card-h">
              <div className="kick">Archivo · {hof.season.name}</div>
              <h2 className="hof-card-title">{hof.season.name}</h2>
              <Link href={`/temporadas/${hof.season.number}`} className="hof-card-link">Ver jornadas y tablas completas →</Link>
            </div>

            <div className="hof-grid">
              <AwardBlock award={hof.champion} />
              <AwardBlock award={hof.pichichi} />
              <AwardBlock award={hof.asistencias} />
              <AwardBlock award={hof.guanteOro} />
              <AwardBlock award={hof.caimanOro} />
              <AwardBlock award={hof.rankingGlobal} />
            </div>

            <div className="hof-records">
              <div className="hof-records-h">Récords históricos</div>
              {hof.records.length === 0 ? (
                <div className="table-note">Sin récords calculables para esta temporada todavía.</div>
              ) : (
                <div className="hof-records-grid">
                  {hof.records.map((r) => (
                    <div key={r.key} className="hof-record">
                      <div className="rl">{r.label}</div>
                      <div className="rv">{r.value}</div>
                      {r.note && <div className="rn">{r.note}</div>}
                    </div>
                  ))}
                </div>
              )}
              <div className="callout note" style={{ marginTop: 14 }}>
                <span className="ci">▶️</span>
                <div>
                  <div className="cd">
                    {hof.recapEpisode.status === "ready" && hof.recapEpisode.youtubeId ? (
                      <a href={`https://www.youtube.com/watch?v=${hof.recapEpisode.youtubeId}`} target="_blank" rel="noopener noreferrer">
                        Ver el episodio resumen de {hof.season.name} →
                      </a>
                    ) : (
                      <>Episodio resumen de {hof.season.name}: <i>pendiente de añadir</i>.</>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
