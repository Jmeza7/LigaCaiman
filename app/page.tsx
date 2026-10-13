import Link from "next/link";
import { getPlayer, keeperAdjusted, createSeasonStats } from "@/lib/stats";
import { getActiveSeason } from "@/lib/seasons";
import { getSeasonBundle } from "@/lib/season-data";
import { resolveJornadaMedia } from "@/lib/season-media";
import { rankWithTies } from "@/lib/awards";
import { CelebrationVideo } from "@/app/components/CelebrationVideo";
import { CountUp } from "@/app/components/CountUp";
import { J6Audio } from "@/app/components/J6Audio";

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 150;
  const H = 30;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d - min) / rng) * (H - 6) - 3;
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;
  const last = pts[pts.length - 1];
  const gid = `sg-${Math.round(pts[0][1] * 100)}-${data.length}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0].toFixed(1)} cy={last[1].toFixed(1)} r="2.6" fill={color} />
    </svg>
  );
}

export default function Home() {
  const season = getActiveSeason();
  const stats = createSeasonStats(getSeasonBundle(season.dataDir), season.config);
  const { jornadas, rankingsData } = stats;
  const hasData = jornadas.length > 0;

  const lastJornada = hasData ? jornadas[jornadas.length - 1] : null;
  const media = lastJornada ? resolveJornadaMedia(season.number, lastJornada.number) : null;

  return (
    <>
      {/* HERO */}
      <header className="vhero">
        {media?.heroVideo ? (
          <CelebrationVideo src={media.heroVideo} poster={media.heroPoster ?? ""} loop className="vhero-video" />
        ) : null}
        <div className="vhero-grid" />
        <div className="vhero-veil" />
        <div className="vhero-inner">
          <div className="kick">Tandem Xports presenta</div>
          <h1 className="big">
            <span className="gradient-text">LIGA</span>
            <span style={{ color: "var(--cyan)" }}>CAIMÁN</span>
          </h1>
          <div className="sub">
            <span>Madrid</span>
            <span className="dot" />
            <span>Fútbol 7</span>
            <span className="dot" />
            <span>{season.name}</span>
            {hasData && (
              <>
                <span className="dot" />
                <span>{jornadas.length} jornadas jugadas</span>
              </>
            )}
          </div>
        </div>
        {hasData && (
          <div className="vhero-scroll">
            <span>Líderes de la temporada</span>
            <span className="arrow">↓</span>
          </div>
        )}
      </header>

      {hasData ? (
        <HomeWithData season={season} stats={stats} rankingsData={rankingsData} lastJornada={lastJornada!} media={media!} />
      ) : (
        <section className="lc-container" style={{ padding: "44px 28px" }}>
          <div className="panel" style={{ padding: "40px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🐊</div>
            <div className="big display gradient-text" style={{ fontSize: 24, marginBottom: 8 }}>
              La {season.name} arranca pronto
            </div>
            <p style={{ color: "var(--ink-2)" }}>
              Todavía no hay jornadas jugadas. En cuanto se juegue la primera, aquí aparecerán los líderes y el resumen
              de la jornada.{" "}
              <Link href="/hall-of-fame" style={{ color: "var(--cyan)" }}>
                Mientras tanto, repasa el Hall of Fame →
              </Link>
            </p>
          </div>
        </section>
      )}
    </>
  );
}

function HomeWithData({
  season,
  stats,
  rankingsData,
  lastJornada,
  media,
}: {
  season: ReturnType<typeof getActiveSeason>;
  stats: ReturnType<typeof createSeasonStats>;
  rankingsData: ReturnType<typeof createSeasonStats>["rankingsData"];
  lastJornada: ReturnType<typeof createSeasonStats>["jornadas"][number];
  media: ReturnType<typeof resolveJornadaMedia>;
}) {
  const scorers = stats.computeGoalscorers().filter((g) => getPlayer(g.id)?.status !== "emergency_sub");
  const assisters = stats.computeAssists().filter((a) => getPlayer(a.id)?.status !== "emergency_sub");
  const ranking = rankingsData.globalRanking;
  const standings = rankingsData.standings;
  const keepers = rankingsData.keepers
    .map((k) => ({ id: k.playerId, pj: k.pj, conceded: k.conceded, avg: k.conceded / k.pj, adj: keeperAdjusted(k.conceded, k.pj) }))
    .filter((k) => k.pj >= stats.keeperMinPJ)
    .sort((a, b) => a.adj - b.adj);

  const goalsTiers = rankWithTies(scorers, (g) => g.goals);
  const assistsTiers = rankWithTies(assisters, (a) => a.assists);
  const rankingTiers = rankWithTies(ranking, (r) => r.score);
  const pointsTiers = rankWithTies(standings, (s) => s.points);
  const invictoRows = standings.filter((s) => s.isUnbeaten);

  const pichichiIds = goalsTiers[0]?.items.map((g) => g.id) ?? [];
  const asisIds = assistsTiers[0]?.items.map((a) => a.id) ?? [];
  const rankIds = rankingTiers[0]?.items.map((r) => r.playerId) ?? [];
  const leaderIds = (invictoRows.length ? invictoRows : pointsTiers[0]?.items ?? []).map((s) => s.playerId);
  const bestAdj = keepers[0]?.adj ?? 0;
  const porterIds = keepers.filter((k) => Math.abs(k.adj - bestAdj) < 0.005).map((k) => k.id);

  // orden por importancia: Líder · Pichichi · Asistencias · Porteros · Ranking
  const leaders = [
    {
      role: invictoRows.length ? "Líder Invicto" : "Líder", ic: invictoRows.length ? "🛡️" : "👑", tab: "ganadores",
      accent: "var(--lime)", value: pointsTiers[0]?.value ?? 0, dec: 0, unit: "pts", ids: leaderIds, spark: stats.cumulativePoints(leaderIds[0] ?? ""),
      extra: leaderIds.length > 1 ? `${leaderIds.length} empatados a ${pointsTiers[0]?.value ?? 0} pts` : "líder de la general",
    },
    {
      role: "Pichichi", ic: "⚽", tab: "goleadores", accent: "var(--magenta)", value: goalsTiers[0]?.value ?? 0, dec: 0, unit: "goles",
      ids: pichichiIds, spark: stats.cumulativeGoals(pichichiIds[0] ?? ""), extra: `${goalsTiers[0]?.value ?? 0} goles · máximo goleador`,
    },
    {
      role: "Asistencias", ic: "🎯", tab: "asistencias", accent: "var(--cyan)", value: assistsTiers[0]?.value ?? 0, dec: 0, unit: "asist.",
      ids: asisIds, spark: stats.cumulativeAssists(asisIds[0] ?? ""), extra: `${assistsTiers[0]?.value ?? 0} asistencias · nº1`,
    },
    {
      role: "Porteros", ic: "🧤", tab: "porteros", accent: "var(--gold)", value: bestAdj, dec: 2, unit: "aj.",
      ids: porterIds, spark: stats.cumulativePoints(porterIds[0] ?? ""),
      extra: keepers[0] ? `media ${keepers[0].avg.toFixed(2)} · ${keepers[0].pj.toFixed(2)} PJ · el más sólido` : "",
    },
    {
      role: "Ranking Global", ic: "📊", tab: "global", accent: "var(--violet)", value: rankingTiers[0]?.value ?? 0, dec: 1, unit: "pts",
      ids: rankIds, spark: stats.cumulativePoints(rankIds[0] ?? ""), extra: rankIds.length ? `${ranking[0]?.votes}/${ranking[0]?.totalCaptains} capitanes lo votaron nº1` : "",
    },
  ].filter((l) => l.ids.length > 0);
  const noLeaders = leaders.length === 0;

  const ca = teamColor(lastJornada.homeTeam.colors);
  const cb = teamColor(lastJornada.awayTeam.colors);

  return (
    <>
      {/* TARJETAS DE LÍDERES */}
      {!noLeaders && (
        <section className="lc-container" style={{ padding: "44px 28px 18px" }}>
          <div className="leaders">
            {leaders.map((l) => {
              const tie = l.ids.length > 1;
              const href = tie ? `/tablas?tab=${l.tab}` : `/jugador/${l.ids[0]}`;
              const names = l.ids.map((id) => getPlayer(id)?.displayName ?? id);
              return (
                <Link key={l.role} href={href} className="lcard" style={{ ["--accent" as string]: l.accent }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="ph" src={`/animations/${l.ids[0]}.jpg`} alt={names[0]} />
                  <div className="veil" />
                  <div className="edge" />
                  <div className="body">
                    <div className="role"><span className="ic">{l.ic}</span>{l.role}</div>
                    <div className="val">
                      <CountUp value={l.value} dec={l.dec} />
                      <span className="u">{l.unit}</span>
                    </div>
                    <div className="nm" style={tie ? { fontSize: names.length > 2 ? 14 : 17, lineHeight: 1.15 } : undefined}>
                      {tie ? names.join(" · ") : names[0]}
                    </div>
                    <div className="spark"><Sparkline data={l.spark} color={l.accent.startsWith("var") ? cssVarHex(l.accent) : l.accent} /></div>
                    <div className="more">
                      <div className="ex">{l.extra}</div>
                      <span className="btn">{tie ? "Ver tabla →" : "Ver perfil →"}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ÚLTIMA JORNADA */}
      <section className="lc-container j6" style={{ padding: "32px 28px 10px" }}>
        <div className="j6-head">
          <span className="j6-kick">
            🏆 Última jornada · J{lastJornada.number}{lastJornada.narrative ? ` · ${lastJornada.narrative}` : ""}
          </span>
          {media.audio && (
            <J6Audio
              src={media.audio}
              storageKey={`lc_audio_${season.id}_j${lastJornada.number}`}
              ariaLabel={`Música de la jornada ${lastJornada.number}`}
              playingLabel={`Sonando · J${lastJornada.number}`}
              nudgeText={`Toca para escuchar el audio de la jornada ${lastJornada.number}`}
            />
          )}
        </div>
        <Link href={`/jornadas/${lastJornada.number}`} className="j6-frame" style={{ display: "block" }}>
          {media.poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media.poster} alt={`Jornada ${lastJornada.number} · ${lastJornada.homeTeam.name} vs ${lastJornada.awayTeam.name}`} />
          ) : (
            <div
              className="vs-header"
              style={{ ["--ca" as string]: ca, ["--cb" as string]: cb, minHeight: 220 }}
            >
              <div className="vs-bg"><div className="half l" /><div className="half r" /></div>
              <div className="vs-veil" />
              <div className="vs-stage">
                <div className="vs-team home"><div className="tt">{lastJornada.homeTeam.name}</div></div>
                <div className="vs-center">
                  <div className="score"><span className="h">{lastJornada.result.home}</span><span className="sep">·</span><span className="a">{lastJornada.result.away}</span></div>
                  <div className="vslabel">VS</div>
                </div>
                <div className="vs-team away"><div className="tt">{lastJornada.awayTeam.name}</div></div>
              </div>
            </div>
          )}
          <div className="glow" />
        </Link>
        <div className="j6-cap">
          <span><b>{lastJornada.homeTeam.name}</b> · cap. {getPlayer(lastJornada.homeTeam.captain)?.displayName ?? lastJornada.homeTeam.captain}</span>
          <span className="vs">{lastJornada.result.home} — {lastJornada.result.away}</span>
          <span><b>{lastJornada.awayTeam.name}</b> · cap. {getPlayer(lastJornada.awayTeam.captain)?.displayName ?? lastJornada.awayTeam.captain}</span>
        </div>
      </section>
    </>
  );
}

const teamColor = (c: { primary: string }) => {
  const p = (c.primary || "").toLowerCase();
  return p && p !== "#ffffff" && p !== "#f8f8f8" ? c.primary : "#e7e7ea";
};

// resolves the brand css var names to hex for inline SVG stroke
function cssVarHex(v: string): string {
  const map: Record<string, string> = {
    "var(--magenta)": "#FF2E7E",
    "var(--cyan)": "#34E6FF",
    "var(--violet)": "#A981FF",
    "var(--lime)": "#B8FF2E",
    "var(--gold)": "#FFC53D",
  };
  return map[v] ?? "#B8FF2E";
}
