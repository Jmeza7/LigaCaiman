"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { CountUp } from "@/app/components/CountUp";
import { CelebrationVideo } from "@/app/components/CelebrationVideo";
import type { FullProfile, CardStat } from "@/lib/stats";

type Rival = { id: string; name: string; tag: string; cardStats: CardStat[] };
type Achievement = { id: string; name: string; desc: string; icon: string; got: boolean; rare: string };
type OrderItem = { id: string; name: string; rankPos: number | null };

/* ---------- cromo holográfico ---------- */
function PlayerCard({ p }: { p: FullProfile }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transform = `rotateX(${(0.5 - py) * 15}deg) rotateY(${(px - 0.5) * 15}deg)`;
    el.style.setProperty("--mx", px * 100 + "%");
    el.style.setProperty("--my", py * 100 + "%");
    el.classList.add("hot");
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "rotateX(0deg) rotateY(0deg)";
    el.classList.remove("hot");
  };
  return (
    <div className="fcard-stage">
      <div className="fcard" ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}>
        <div className="fcard-foil" />
        <div className="fcard-holo" />
        <div className="fcard-shine" />
        <div className="fcard-inner">
          <div className="fc-top">
            <div className="fc-ovr">
              <div className="num">{p.ovr}</div>
              <div className="pos">{p.pos}</div>
              <div className="divr" />
              <div className="num2">#{p.number}</div>
            </div>
            <div className="fc-badge">
              <div className="caiman">🐊</div>
              <div className="lg">LIGA CAIMÁN</div>
            </div>
          </div>
          <div className="fc-photo">
            {p.poster ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="fc-photo-img" src={p.poster} alt={p.name} />
                {p.video && <CelebrationVideo src={p.video} poster={p.poster} loop className="fc-video" />}
              </>
            ) : (
              <div className="fc-noimg"><span>{p.name.slice(0, 2)}</span></div>
            )}
            <div className="fc-photo-fade" />
            <div className="fc-shadow" />
          </div>
          <div className="fc-name">{p.name}</div>
          <div className="fc-edition">★ EDICIÓN {p.edition} ★</div>
          <div className="fc-line" />
          <div className="fc-stats">
            {p.cardStats.map((s) => (
              <div className="fc-stat" key={s.k}>
                <span className="v">{s.v}</span>
                <span className="k">{s.k}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- gráfica de línea (puntos acumulados) ---------- */
function LineChart({ data, color }: { data: { n: number; v: number }[]; color: string }) {
  const W = 520, H = 210, padL = 16, padR = 16, padT = 26, padB = 34;
  const vals = data.map((d) => d.v);
  let minR = Math.min(...vals), maxR = Math.max(...vals);
  const pad = Math.max(1, (maxR - minR) * 0.15);
  minR = Math.max(0, minR - pad);
  maxR = maxR + pad;
  if (maxR === minR) maxR = minR + 1;
  const x = (i: number) => padL + i * ((W - padL - padR) / Math.max(1, data.length - 1));
  const y = (v: number) => padT + (1 - (v - minR) / (maxR - minR)) * (H - padT - padB);
  const pts = data.map((d, i) => [x(i), y(d.v)] as const);
  const line = pts.map((q, i) => (i ? "L" : "M") + q[0] + " " + q[1]).join(" ");
  const area = line + ` L ${x(data.length - 1)} ${H - padB} L ${x(0)} ${H - padB} Z`;
  const gid = "lc-" + color.replace("#", "");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={padL} x2={W - padR} y1={padT + f * (H - padT - padB)} y2={padT + f * (H - padT - padB)} stroke="rgba(255,255,255,.06)" />
      ))}
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((q, i) => (
        <g key={i}>
          <circle cx={q[0]} cy={q[1]} r="5" fill="#06070a" stroke={color} strokeWidth="3" />
          <text x={q[0]} y={q[1] - 13} fill="#dfe9f5" fontSize="13" fontFamily="JetBrains Mono" fontWeight="700" textAnchor="middle">{data[i].v}</text>
          <text x={q[0]} y={H - 12} fill="#7d828d" fontSize="11" fontFamily="Hanken Grotesk" fontWeight="800" textAnchor="middle">J{data[i].n}</text>
        </g>
      ))}
    </svg>
  );
}

function GoalsChart({ data }: { data: { n: number; g: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.g));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 186, padding: "10px 4px 0" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
          <div style={{ fontFamily: "var(--f-num)", fontWeight: 700, fontSize: 20, color: "#FF2E7E", marginBottom: 6, letterSpacing: "-0.03em" }}>{d.g}</div>
          <div style={{ width: "100%", maxWidth: 44, borderRadius: "9px 9px 4px 4px", background: "linear-gradient(180deg,#FF2E7E,#A981FF)", height: `${(d.g / max) * 100}%`, boxShadow: "0 8px 24px -8px rgba(255,46,126,.6)" }} />
          <div style={{ marginTop: 8, fontFamily: "Hanken Grotesk", fontWeight: 800, fontSize: 11, color: "#7d828d" }}>J{d.n}</div>
        </div>
      ))}
    </div>
  );
}

function Radar({ me, them, labels, meName, themName }: { me: number[]; them: number[]; labels: string[]; meName: string; themName: string }) {
  const S = 300, c = S / 2, R = 108;
  const ang = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
  const pt = (v: number, i: number) => [c + Math.cos(ang(i)) * R * (v / 100), c + Math.sin(ang(i)) * R * (v / 100)];
  const poly = (arr: number[]) => arr.map((v, i) => pt(v, i).join(",")).join(" ");
  const ring = (f: number) => [0, 1, 2, 3, 4, 5].map((i) => pt(f, i).join(",")).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${S} ${S}`} style={{ width: "100%", maxWidth: 330, display: "block", margin: "0 auto" }}>
        {[25, 50, 75, 100].map((f) => <polygon key={f} points={ring(f)} fill="none" stroke="rgba(255,255,255,.07)" />)}
        {[0, 1, 2, 3, 4, 5].map((i) => { const q = pt(100, i); return <line key={i} x1={c} y1={c} x2={q[0]} y2={q[1]} stroke="rgba(255,255,255,.06)" />; })}
        <polygon points={poly(them)} fill="rgba(125,130,141,.16)" stroke="#7d828d" strokeWidth="2" />
        <polygon points={poly(me)} fill="rgba(184,255,46,.20)" stroke="#B8FF2E" strokeWidth="2.5" />
        {labels.map((l, i) => { const q = pt(126, i); return <text key={i} x={q[0]} y={q[1]} fill="#aeb4be" fontSize="12" fontFamily="Hanken Grotesk" fontWeight="800" textAnchor="middle" dominantBaseline="middle">{l}</text>; })}
      </svg>
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "var(--lime)" }}>● {meName}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#7d828d" }}>● {themName}</span>
      </div>
    </div>
  );
}

function Achievements({ items }: { items: Achievement[] }) {
  const got = items.filter((a) => a.got).length;
  return (
    <div>
      <div className="badge-grid">
        {items.map((a) => (
          <div key={a.id} className={`badge ${a.got ? "got r-" + a.rare : "locked"}`}>
            <span className="ic">{a.icon}</span>
            <div className="bn">{a.name}</div>
            <div className="bd">{a.desc}</div>
            {a.got && <div className="rarity">{a.rare === "gold" ? "Legendario" : a.rare === "epic" ? "Épico" : a.rare === "rare" ? "Raro" : "Común"}</div>}
          </div>
        ))}
      </div>
      <div className="badge-progress">
        <span className="num">{got}/{items.length}</span>
        <div className="bar"><span style={{ width: `${(got / items.length) * 100}%` }} /></div>
        <span>logros desbloqueados</span>
      </div>
    </div>
  );
}

function Chemistry({ items }: { items: FullProfile["chem"] }) {
  const rate = (it: { w: number; l: number }) => (it.w + it.l ? it.w / (it.w + it.l) : 0);
  let bestI = 0, worstI = 0;
  items.forEach((it, i) => {
    if (rate(it) > rate(items[bestI]) || (rate(it) === rate(items[bestI]) && it.w + it.l > items[bestI].w + items[bestI].l)) bestI = i;
    if (rate(it) < rate(items[worstI])) worstI = i;
  });
  return (
    <div className="chem-list">
      {items.map((it, i) => (
        <Link key={it.id} href={`/jugador/${it.id}`} className={`chem ${i === bestI ? "best" : ""} ${i === worstI && bestI !== worstI ? "worst" : ""}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="who">
            <span className="nm">{it.name}</span>
            {i === bestI ? <span className="chem-flag">★ Mejor dupla</span>
              : i === worstI ? <span className="chem-flag">⚠ Tu kryptonita</span>
                : <span className="nt">{it.w + it.l} juntos</span>}
          </div>
          <div className="chem-bar"><span style={{ width: `${rate(it) * 100}%` }} /></div>
          <div className="rec"><span className="w">{it.w}V</span> · <span className="l">{it.l}D</span></div>
        </Link>
      ))}
    </div>
  );
}

function Comparativa({ me, rivals }: { me: FullProfile; rivals: Rival[] }) {
  const [idx, setIdx] = useState(0);
  if (!rivals.length) return null;
  const rival = rivals[idx];
  const meVals = me.cardStats.map((s) => s.v);
  const themVals = rival.cardStats.map((s) => s.v);
  const labels = me.cardStats.map((s) => s.k);
  return (
    <section className="section">
      <div className="lc-container">
        <div className="section-head">
          <div className="eyebrow">Cara a cara</div>
          <div className="t gradient-text">Comparativa</div>
          <div className="d">{me.name} vs los mejores del ranking, atributo por atributo.</div>
        </div>
        <div className="rival-pills">
          <span style={{ alignSelf: "center", fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 12, letterSpacing: "1.5px", color: "var(--lime)", marginRight: 4 }}>{me.name} VS</span>
          {rivals.map((r, i) => (
            <button key={r.id} className={`rival-pill ${i === idx ? "active" : ""}`} onClick={() => setIdx(i)}>
              {r.name} <span style={{ opacity: 0.6, fontWeight: 700 }}>· {r.tag}</span>
            </button>
          ))}
        </div>
        <div className="panel">
          <div className="compare">
            <div className="cmp-rows">
              {me.cardStats.map((s, i) => (
                <div className="cmp-row" key={s.k}>
                  <div className="lbl">{s.label} · {s.k}</div>
                  <div className="cmp-num me">{meVals[i]}</div>
                  <div className="cmp-track">
                    <div className="me" style={{ width: `${(meVals[i] / (meVals[i] + themVals[i])) * 100}%` }} />
                    <div className="them" style={{ flex: 1 }} />
                  </div>
                  <div className="cmp-num them">{themVals[i]}</div>
                </div>
              ))}
            </div>
            <Radar me={meVals} them={themVals} labels={labels} meName={me.name} themName={rival.name} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ProfileView({
  p,
  order,
  rivals,
  achievements,
  leagueMaxGoals,
}: {
  p: FullProfile;
  order: OrderItem[];
  rivals: Rival[];
  achievements: Achievement[];
  leagueMaxGoals: number;
}) {
  const i = order.findIndex((o) => o.id === p.id);
  const prev = i > 0 ? order[i - 1] : null;
  const next = i >= 0 && i < order.length - 1 ? order[i + 1] : null;
  const isTop = p.goals > 0 && p.goals === leagueMaxGoals;

  const tags: { cls: string; el: React.ReactNode }[] = [
    { cls: "live", el: <span><span className="dot" /> {p.status === "active" ? "ACTIVO" : p.status === "left" ? "RETIRADO" : p.status === "emergency_sub" ? "SUPLENTE" : p.status}</span> },
  ];
  if (isTop) tags.push({ cls: "gold2", el: "★ PICHICHI" });
  if (p.oro > 0) tags.push({ cls: "gold2", el: "🐊 CAIMÁN DE ORO" });
  if (p.rankPos === 1) tags.push({ cls: "gold2", el: "👑 Nº1 RANKING" });
  if (p.unbeaten) tags.push({ cls: "gold2", el: "🛡️ INVICTO" });
  if (p.keeper) tags.push({ cls: "gold2", el: "🧤 PORTERO" });

  const rankChip = (r: number | null) =>
    r ? <span className="rankpos">{r === 1 ? "🥇 #1" : `#${r}`}</span> : null;

  const stats: { lab: string; val: number; dec?: number; acc: string; rank: number | null; note: string }[] = [
    { lab: "Goles", val: p.goals, acc: "var(--magenta)", rank: p.goalsRank, note: isTop ? "Pichichi de la liga" : p.goals > 0 ? "en goleadores" : `en ${p.played} jornadas` },
    { lab: "Asistencias", val: p.assists, acc: "var(--cyan)", rank: p.assistsRank, note: p.assists > 0 ? "en asistencias" : "pases de gol" },
    { lab: "Puntos", val: p.points, acc: "var(--lime)", rank: p.pointsRank, note: `${p.wins}V · ${p.losses}D` },
    p.ranking != null
      ? { lab: "Ranking", val: p.ranking, dec: 1, acc: "var(--violet)", rank: p.rankPos, note: `${p.rankVotes} votos` }
      : { lab: "Caimán Oro", val: p.oro, acc: "var(--violet)", rank: null, note: p.oro ? "MVP" : "sin ranking aún" },
  ];

  const winsForm = p.form.filter((f) => f === "W").length;
  const playedForm = p.form.filter((f) => f !== "N").length;
  const winPct = playedForm ? Math.round((winsForm / playedForm) * 100) : 0;
  const cumPData = p.history.map((h) => ({ n: h.n, v: h.cumP }));
  const goalsData = p.history.map((h) => ({ n: h.n, g: h.g }));

  return (
    <>
      {/* rail selector */}
      <div className="pswitch">
        <div className="pswitch-rail">
          {order.map((o) => (
            <Link key={o.id} href={`/jugador/${o.id}`} className={`pchip${o.id === p.id ? " active" : ""}`}>
              <span className="pr">{o.rankPos ?? "—"}</span>{o.name}
            </Link>
          ))}
        </div>
      </div>

      {/* hero */}
      <header className="hero">
        <div className="lc-container">
          <div className="hero-top">
            <Link className="back-link" href="/tablas">← Volver a las tablas</Link>
          </div>
          <div className="hero-grid">
            <PlayerCard p={p} />
            <div className="hero-right">
              <div className="hero-meta">
                {tags.map((t, k) => <span key={k} className={`tag ${t.cls}`}>{t.el}</span>)}
              </div>
              <h1 className="hero-name gradient-text">{p.name}</h1>
              <div className="hero-meta">
                <span className="kicker">Debut en J{p.joined ?? 1}</span>
                <span className="kicker" style={{ color: "var(--mut-2)" }}>·</span>
                <span className="kicker">{p.pos}{p.rankPos ? ` · #${p.rankPos} ranking` : ""}</span>
              </div>
              <p className="hero-sub">
                {p.played > 0 ? <>{isTop ? <>Máximo goleador con <b>{p.goals} goles</b>.</> : p.goals > 0 ? <><b>{p.goals} goles</b> en {p.played} jornadas.</> : <>{p.played} jornadas jugadas.</>}{p.oro > 0 && <> Caimán de Oro {p.oro > 1 ? `${p.oro} veces` : "vigente"}.</>}{p.unbeaten && <> Sigue <b>invicto</b> esta temporada.</>}</> : <>Aún no ha jugado una caimana.</>}
                {" "}Mueve el cromo para ver el holograma.
              </p>
              <div className="statgrid">
                {stats.map((s) => (
                  <div className="statcard" key={s.lab} style={{ ["--accent" as string]: s.acc }}>
                    <div className="lab">{s.lab}{rankChip(s.rank)}</div>
                    <div className="val"><CountUp value={s.val} dec={s.dec || 0} /></div>
                    <div className="note">{s.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* evolución */}
      {p.history.length > 0 && (
        <section className="section">
          <div className="lc-container">
            <div className="section-head">
              <div className="eyebrow">Crecimiento · temporada 2026</div>
              <div className="t gradient-text">Su evolución</div>
              <div className="d">Cómo creció jornada a jornada dentro de la liga.</div>
            </div>
            <div className="charts2">
              <div className="panel">
                <div className="chart-title">Puntos acumulados</div>
                <div className="chart-big" style={{ color: "var(--cyan)" }}><CountUp value={p.points} /><small>{p.wins} victorias · {p.losses} derrotas</small></div>
                <LineChart data={cumPData} color="#34E6FF" />
              </div>
              <div className="panel">
                {p.goals > 0 ? (
                  <>
                    <div className="chart-title">Goles por jornada</div>
                    <div className="chart-big" style={{ color: "var(--magenta)" }}><CountUp value={p.goals} /><small>goles en total</small></div>
                    <GoalsChart data={goalsData} />
                  </>
                ) : p.keeper ? (
                  <>
                    <div className="chart-title">Bajo los tres palos</div>
                    <div className="chart-big" style={{ color: "var(--lime)" }}><CountUp value={p.keeper.avg} dec={2} /><small>goles encajados por PJ</small></div>
                    <div style={{ marginTop: 10, color: "var(--mut)", fontSize: 14, lineHeight: 1.6 }}>
                      {p.keeper.conceded} goles encajados en <b style={{ color: "var(--ink-2)" }}>{p.keeper.pj.toFixed(2)} PJ</b> (partido equivalente).{" "}
                      {p.keeper.classified ? "Clasificado en el ranking de porteros." : "Aún sin clasificar (necesita 2.00 PJ)."}
                      {p.keeper.note ? ` ${p.keeper.note}.` : ""}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="chart-title">Asistencias</div>
                    <div className="chart-big" style={{ color: "var(--cyan)" }}><CountUp value={p.assists} /><small>pases de gol</small></div>
                    <div style={{ marginTop: 10, color: "var(--mut)", fontSize: 14, lineHeight: 1.6 }}>Su aporte no está en el gol: {p.wins} victorias en {p.played} jornadas.</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* forma */}
      {p.history.length > 0 && (
        <section className="section">
          <div className="lc-container">
            <div className="section-head">
              <div className="eyebrow">Momento</div>
              <div className="t">Racha de forma</div>
              <div className="d">{winsForm} victorias en {playedForm} jornadas jugadas{p.unbeaten ? " · sin perder" : ""}.</div>
            </div>
            <div className="panel">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
                <div className="form-row">
                  {p.form.map((r, k) => (
                    <div key={k} className={`form-pill ${r}`}><span className="jn">J{k + 1}</span>{r === "N" ? "·" : r}</div>
                  ))}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--f-num)", fontWeight: 700, fontSize: 52, color: "var(--lime)", lineHeight: 1, letterSpacing: "-0.04em" }}><CountUp value={winPct} suffix="%" /></div>
                  <div className="kicker" style={{ marginTop: 4 }}>de victorias</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* logros */}
      <section className="section">
        <div className="lc-container">
          <div className="section-head">
            <div className="eyebrow">Vitrina</div>
            <div className="t gradient-text">Logros</div>
            <div className="d">Insignias que se desbloquean por lo que haces en la cancha.</div>
          </div>
          <Achievements items={achievements} />
        </div>
      </section>

      {/* química */}
      {p.chem.length > 0 && (
        <section className="section">
          <div className="lc-container">
            <div className="section-head">
              <div className="eyebrow">Vínculos</div>
              <div className="t">Química</div>
              <div className="d">Con quién gana y con quién se le tuerce — el draft cambia cada jornada.</div>
            </div>
            <div className="panel"><Chemistry items={p.chem} /></div>
          </div>
        </section>
      )}

      {/* comparativa */}
      <Comparativa me={p} rivals={rivals} />

      {/* historial */}
      {p.history.length > 0 && (
        <section className="section">
          <div className="lc-container">
            <div className="section-head">
              <div className="eyebrow">Registro completo</div>
              <div className="t">Historial por jornada</div>
            </div>
            <div className="hist">
              {[...p.history].reverse().map((d) => {
                const [a, b] = d.score.split("-");
                return (
                  <Link key={d.n} href={`/jornadas/${d.n}`} className="hrow">
                    <div className={`res ${d.res}`}>{d.res === "W" ? "V" : "D"}</div>
                    <div className="mid">
                      <div className="jn">JORNADA {d.n}{d.oro ? "  ·  🐊 CAIMÁN DE ORO" : ""}</div>
                      <div className="mt"><b>{d.team}</b> <span>vs {d.opp}</span></div>
                    </div>
                    <div className="right">
                      <div className="ga">
                        <div className="item"><div className="n g">{d.g}</div><div className="l">Goles</div></div>
                        <div className="item"><div className="n a">{d.a}</div><div className="l">Asist.</div></div>
                      </div>
                      <div className="score"><span className={d.res === "W" ? "w" : "x"}>{a}</span><span className="x">-{b}</span></div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section" style={{ borderTop: "none" }}>
        <div className="lc-container">
          <div className="cta">
            <div className="t gradient-text">Explora a los demás caimanes</div>
            <div className="d">Cada jugador de la liga tiene su cromo, sus stats y su química. Salta a otro perfil o vuelve a las tablas.</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              {prev && <Link className="btn" href={`/jugador/${prev.id}`}>← {prev.name}</Link>}
              {next && <Link className="btn" href={`/jugador/${next.id}`}>{next.name} →</Link>}
              <Link className="btn alt" href="/tablas">Ver tablas</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
