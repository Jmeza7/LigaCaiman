import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayer, createSeasonStats } from "@/lib/stats";
import { getActiveSeason } from "@/lib/seasons";
import { getSeasonBundle } from "@/lib/season-data";
import { resolveJornadaMedia } from "@/lib/season-media";
import { GoalTimeline, type TLGoal } from "@/app/components/GoalTimeline";

export function generateStaticParams() {
  const season = getActiveSeason();
  const jornadas = getSeasonBundle(season.dataDir).jornadas;
  return jornadas.map((j) => ({ n: String(j.number) }));
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const { n } = await params;
  const season = getActiveSeason();
  const jornadas = getSeasonBundle(season.dataDir).jornadas;
  const j = jornadas.find((x) => x.number === Number(n));
  return { title: j ? `Jornada ${j.number}${j.narrative ? " · " + j.narrative : ""} — Liga Caimán` : "Jornada — Liga Caimán" };
}

const dn = (id: string) => (id === "ximena" ? "Ximena" : getPlayer(id)?.displayName ?? id);
const teamColor = (c: { primary: string }) => {
  const p = (c.primary || "").toLowerCase();
  return p && p !== "#ffffff" && p !== "#f8f8f8" ? c.primary : "#e7e7ea";
};
const parseMin = (m?: string | null) => {
  if (!m) return 0;
  // soporta "MM:SS" (J5, absoluto) y "MM:SS NT" por tiempo (J6 en adelante)
  const mm = m.match(/(\d+):(\d+)/);
  const base = mm ? Number(mm[1]) * 60 + Number(mm[2]) : 0;
  const t = m.match(/(\d)\s*T/i);
  const offset = t && Number(t[1]) >= 2 ? (Number(t[1]) - 1) * 30 * 60 : 0;
  return base + offset;
};

export default async function JornadaPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const num = Number(n);

  const season = getActiveSeason();
  const bundle = getSeasonBundle(season.dataDir);
  const stats = createSeasonStats(bundle, season.config);
  const { jornadas } = bundle;

  const j = jornadas.find((x) => x.number === num);
  if (!j) notFound();

  const idx = jornadas.findIndex((x) => x.number === num);
  const prev = idx > 0 ? jornadas[idx - 1].number : null;
  const next = idx < jornadas.length - 1 ? jornadas[idx + 1].number : null;

  const ca = teamColor(j.homeTeam.colors);
  const cb = teamColor(j.awayTeam.colors);
  const dateStr = new Date(j.date + "T12:00:00")
    .toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
    .toUpperCase();

  const { total, avg, pct } = stats.jornadaStats(num);
  const up = pct >= 0;
  const maxBar = Math.max(total, avg);

  const hasMin = j.goals.some((g) => g.minute);
  const maxMin = Math.max(1, ...j.goals.map((g) => parseMin(g.minute)));
  const tlGoals: TLGoal[] = j.goals.map((g) => ({
    team: g.team,
    min: g.minute ?? null,
    posPct: hasMin ? (parseMin(g.minute) / maxMin) * 100 : 0,
    scorer: dn(g.scorer),
    sub: getPlayer(g.scorer)?.status === "emergency_sub",
    teamName: g.team === "home" ? j.homeTeam.name : j.awayTeam.name,
    assist: g.assist ? dn(g.assist) : null,
    keeper: g.scoredAgainst ? dn(g.scoredAgainst) : null,
    after: g.scoreAfter ?? null,
  }));
  // separa goles que caen en la misma posición (p.ej. goles sin minuto exacto)
  for (let i = 1; i < tlGoals.length; i++) {
    if (tlGoals[i].posPct <= tlGoals[i - 1].posPct + 1.5) {
      tlGoals[i].posPct = Math.min(100, tlGoals[i - 1].posPct + 3.5);
    }
  }

  const poster = resolveJornadaMedia(season.number, num).poster;
  const top5 = stats.top5After(num);

  return (
    <div className="lc-container" style={{ paddingBottom: 44 }}>
      <header className="phero" style={{ paddingBottom: 10 }}>
        <h1 className="big gradient-text">Jornadas</h1>
        <div className="sub">Cada caimana, al detalle · goles, MVP y cómo movió las tablas</div>
      </header>

      {/* selector */}
      <div className="jnav">
        <div className="jpills">
          {jornadas.map((x) => (
            <Link key={x.number} href={`/jornadas/${x.number}`} className={`jpill${x.number === num ? " active" : ""}`}>
              {x.number}
            </Link>
          ))}
        </div>
        <div className="jnav-btns">
          <Link href={prev ? `/jornadas/${prev}` : "#"} className={`jbtn${prev ? "" : " disabled"}`}>← Anterior</Link>
          <Link href={next ? `/jornadas/${next}` : "#"} className={`jbtn${next ? "" : " disabled"}`}>Siguiente →</Link>
        </div>
      </div>

      {/* cabecera cinemática */}
      {poster ? (
        <>
          <div className="vs-poster-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={poster} alt={`${j.narrative ?? `Jornada ${num}`} · ${j.homeTeam.name} vs ${j.awayTeam.name}`} />
            <div className="pe" />
          </div>
          <div className="jscore">
            <div className="js-meta">
              <div className="narr">{j.narrative ?? `Jornada ${num}`}</div>
              <div className="dt">Jornada {num} · {dateStr} · {total} goles</div>
            </div>
            <div className="jt home">
              {j.homeTeam.name}
              <span className="cp"><span className="dot" style={{ background: ca }} />cap. {dn(j.homeTeam.captain)}</span>
            </div>
            <div className="js-sc"><span className="h">{j.result.home}</span><span className="s">-</span><span className="a">{j.result.away}</span></div>
            <div className="jt away">
              {j.awayTeam.name}
              <span className="cp"><span className="dot" style={{ background: cb }} />cap. {dn(j.awayTeam.captain)}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="vs-header" style={{ ["--ca" as string]: ca, ["--cb" as string]: cb }}>
          <div className="vs-bg"><div className="half l" /><div className="half r" /></div>
          <div className="vs-veil" />
          <div className="vs-spark" />
          <div className="vs-meta">
            <div className="narr">{j.narrative ?? `Jornada ${num}`}</div>
            <div className="dt">Jornada {num} · {dateStr}</div>
          </div>
          <div className="vs-stage">
            <div className="vs-team home">
              <div className="tt">{j.homeTeam.name}</div>
              <div className="cp"><span className="dot" style={{ background: ca }} />cap. <b>{dn(j.homeTeam.captain)}</b></div>
            </div>
            <div className="vs-center">
              <div className="score"><span className="h">{j.result.home}</span><span className="sep">·</span><span className="a">{j.result.away}</span></div>
              <div className="vslabel">VS</div>
            </div>
            <div className="vs-team away">
              <div className="tt">{j.awayTeam.name}</div>
              <div className="cp"><span className="dot" style={{ background: cb }} />cap. <b>{dn(j.awayTeam.captain)}</b></div>
            </div>
          </div>
          <div className="vs-foot">{total} goles · {j.goals.length} anotaciones registradas</div>
        </div>
      )}

      {/* cronología */}
      <div className="jblock">
        <div className="jblock-h"><span className="ic">⏱️</span><span className="t">Cronología de goles</span><span className="hint">hover / tap en cada gol</span></div>
        <GoalTimeline goals={tlGoals} hasMin={hasMin} homeName={j.homeTeam.name} awayName={j.awayTeam.name} />
      </div>

      {/* stats vs media */}
      <div className="jblock">
        <div className="jblock-h"><span className="ic">📈</span><span className="t">El partido vs la media</span></div>
        <div className="crazy">
          <div className="crazy-main">
            <div className="num">{total}</div>
            <div className="lab">goles en esta jornada</div>
            <div className="crazy-bars">
              <div className="crazy-bar this">
                <div className="cbh"><span>Esta jornada</span><b>{total}</b></div>
                <div className="track"><span style={{ width: `${(total / maxBar) * 100}%` }} /></div>
              </div>
              <div className="crazy-bar avgb">
                <div className="cbh"><span>Media de la liga</span><b>{avg}</b></div>
                <div className="track"><span style={{ width: `${(avg / maxBar) * 100}%` }} /></div>
              </div>
            </div>
          </div>
          <div className="crazy-verdict">
            <div className={`big ${up ? "up" : "down"}`}>{up ? "+" : ""}{pct}%</div>
            <div className="vtext">{up ? "más loco de lo normal" : "más tranquila que la media"}</div>
            <div className="vsmall">{total} goles vs una media de {avg} por jornada</div>
          </div>
        </div>
      </div>

      {/* MVP */}
      {j.mvps.length > 0 && (
      <div className="jblock">
        <div className="jblock-h"><span className="ic">🐊</span><span className="t">MVP de la jornada</span></div>
        <div className="mvp-wrap">
          {j.mvps.map((m, i) => {
            if (m.type === "honorary") {
              return (
                <div key={i} className="mvp honor">
                  <div className="info">
                    <span className="badge-oro">🐊 Caimán de Oro Honorífico</span>
                    <div className="mname">{dn(m.playerId)}</div>
                    <div className="mrole">{m.notes ?? ""}</div>
                  </div>
                </div>
              );
            }
            const g = j.goals.filter((x) => x.countsForStats && x.scorer === m.playerId).length;
            const a = j.goals.filter((x) => x.countsForStats && x.assist === m.playerId).length;
            return (
              <Link key={i} href={`/jugador/${m.playerId}`} className="mvp">
                <div className="photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/animations/${m.playerId}.jpg`} alt={dn(m.playerId)} />
                  <div className="pveil" />
                </div>
                <div className="info">
                  <span className="badge-oro">🐊 Caimán de Oro · J{num}</span>
                  <div className="mname">{dn(m.playerId)}</div>
                  <div className="mrole">MVP por votación del grupo</div>
                  <div className="mstats">
                    <div className="s"><div className="n g">{g}</div><div className="l">Goles</div></div>
                    <div className="s"><div className="n a">{a}</div><div className="l">Asist.</div></div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      )}

      {/* YouTube */}
      <div className="jblock">
        <div className="jblock-h"><span className="ic">▶️</span><span className="t">Episodio completo</span></div>
        <div className="yt">
          {j.episode.youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${j.episode.youtubeId}`}
              title={j.episode.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <a className="yt-ph" href="https://www.youtube.com/@tandemxports" target="_blank" rel="noopener noreferrer">
              <div className="play">▶</div>
              <div className="ptitle">{j.episode.title}</div>
              {j.episode.description && <div className="pdesc">{j.episode.description}</div>}
              <div className="pnote">Episodio en @tandemxports</div>
            </a>
          )}
        </div>
      </div>

      {/* cambios en tablas */}
      <div className="jblock">
        <div className="jblock-h"><span className="ic">🔀</span><span className="t">Lo que cambió en las tablas</span><span className="hint">Top 5 tras la J{num}</span></div>
        <div className="changes">
          {top5.map((p, i) => (
            <Link key={p.id} href={`/jugador/${p.id}`} className={`crow ${i < 3 ? "t" + (i + 1) : ""}`}>
              <div className="pos">{i + 1}</div>
              <div className="cn">{p.name}</div>
              <div className="cpts">{p.pts} pts</div>
              {p.delta === "new" ? (
                <span className="delta new">● NUEVO</span>
              ) : p.delta > 0 ? (
                <span className="delta up">▲ {p.delta}</span>
              ) : p.delta < 0 ? (
                <span className="delta down">▼ {Math.abs(p.delta)}</span>
              ) : (
                <span className="delta same">— igual</span>
              )}
            </Link>
          ))}
        </div>
        <div className="changes-note">Movimiento de posición respecto a la jornada anterior</div>
      </div>
    </div>
  );
}
