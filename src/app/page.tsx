import Link from "next/link";
import {
  jornadas,
  getPlayer,
  computeGoalscorers,
  computeAssists,
  cumulativeGoals,
  cumulativeAssists,
  cumulativePoints,
  keeperAdjusted,
} from "@/lib/stats";
import rankingsData from "@/data/rankings.json";
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
  const scorers = computeGoalscorers().filter((g) => getPlayer(g.id)?.status !== "emergency_sub");
  const assisters = computeAssists().filter((a) => getPlayer(a.id)?.status !== "emergency_sub");
  const ranking = rankingsData.globalRanking;
  const standings = rankingsData.standings;
  const keepers = rankingsData.keepers
    .map((k) => ({ id: k.playerId, pj: k.pj, conceded: k.conceded, avg: k.conceded / k.pj, adj: keeperAdjusted(k.conceded, k.pj) }))
    .filter((k) => k.pj >= 2)
    .sort((a, b) => a.adj - b.adj);

  // #1 de cada categoría · incluye a TODOS los empatados en el primer lugar
  const topGoals = scorers[0]?.goals ?? 0;
  const pichichiIds = scorers.filter((g) => g.goals === topGoals).map((g) => g.id);
  const topAssists = assisters[0]?.assists ?? 0;
  const asisIds = assisters.filter((a) => a.assists === topAssists).map((a) => a.id);
  const topScore = ranking[0]?.score ?? 0;
  const rankIds = ranking.filter((r) => r.score === topScore).map((r) => r.playerId);
  const invictoRows = standings.filter((s) => s.isUnbeaten);
  const maxPts = standings[0]?.points ?? 0;
  const leaderIds = (invictoRows.length ? invictoRows : standings.filter((s) => s.points === maxPts)).map((s) => s.playerId);
  const bestAdj = keepers[0]?.adj ?? 0;
  const porterIds = keepers.filter((k) => Math.abs(k.adj - bestAdj) < 0.005).map((k) => k.id);

  // orden por importancia: Líder · Pichichi · Asistencias · Porteros · Ranking
  const leaders = [
    {
      role: invictoRows.length ? "Líder Invicto" : "Líder", ic: invictoRows.length ? "🛡️" : "👑", tab: "ganadores",
      accent: "var(--lime)", value: maxPts, dec: 0, unit: "pts", ids: leaderIds, spark: cumulativePoints(leaderIds[0]),
      extra: leaderIds.length > 1 ? `${leaderIds.length} empatados a ${maxPts} pts` : "líder de la general",
    },
    {
      role: "Pichichi", ic: "⚽", tab: "goleadores", accent: "var(--magenta)", value: topGoals, dec: 0, unit: "goles",
      ids: pichichiIds, spark: cumulativeGoals(pichichiIds[0]), extra: `${topGoals} goles · máximo goleador`,
    },
    {
      role: "Asistencias", ic: "🎯", tab: "asistencias", accent: "var(--cyan)", value: topAssists, dec: 0, unit: "asist.",
      ids: asisIds, spark: cumulativeAssists(asisIds[0]), extra: `${topAssists} asistencias · nº1`,
    },
    {
      role: "Porteros", ic: "🧤", tab: "porteros", accent: "var(--gold)", value: bestAdj, dec: 2, unit: "aj.",
      ids: porterIds, spark: cumulativePoints(porterIds[0]),
      extra: keepers[0] ? `media ${keepers[0].avg.toFixed(2)} · ${keepers[0].pj.toFixed(2)} PJ · el más sólido` : "",
    },
    {
      role: "Ranking Global", ic: "📊", tab: "global", accent: "var(--violet)", value: topScore, dec: 1, unit: "pts",
      ids: rankIds, spark: cumulativePoints(rankIds[0]), extra: `${ranking[0]?.votes}/${ranking[0]?.totalCaptains} capitanes lo votaron nº1`,
    },
  ];

  return (
    <>
      {/* HERO con vídeo de fondo */}
      <header className="vhero">
        <CelebrationVideo
          src="/videos/jornada8.mp4"
          poster="/videos/jornada8.jpg"
          loop
          className="vhero-video"
        />
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
            <span>{jornadas.length} jornadas jugadas</span>
          </div>
        </div>
        <div className="vhero-scroll">
          <span>Líderes de la temporada</span>
          <span className="arrow">↓</span>
        </div>
      </header>

      {/* TARJETAS DE LÍDERES */}
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

      {/* ÚLTIMA JORNADA · J8 */}
      <section className="lc-container j6" style={{ padding: "32px 28px 10px" }}>
        <div className="j6-head">
          <span className="j6-kick">🏆 Última jornada · J8 · El Derby Vicioso</span>
          <J6Audio src="/jornadas/jornada8.mp3" />
        </div>
        <Link href="/jornadas/8" className="j6-frame" style={{ display: "block" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/jornadas/jornada8.png" alt="Jornada 8 · Alcohólicos de Barril vs Manchester Piti" />
          <div className="glow" />
        </Link>
        <div className="j6-cap">
          <span><b>Alcohólicos de Barril</b> · cap. Renato</span>
          <span className="vs">9 — 6</span>
          <span><b>Manchester Piti</b> · cap. Josef</span>
        </div>
      </section>
    </>
  );
}

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
