import Link from "next/link";
import { getPlayer } from "@/lib/stats";
import type { Jornada, Partido } from "@/lib/types";
import { getPartidos, jornadaTeamsSummary } from "@/lib/jornada-helpers";
import { GoalTimeline, type TLGoal } from "@/app/components/GoalTimeline";
import { PlayerAvatar } from "@/app/components/PlayerAvatar";

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
const legLabel = (leg?: "ida" | "vuelta" | null) => (leg === "ida" ? "IDA" : leg === "vuelta" ? "VUELTA" : null);

function buildTlGoals(p: Partido): { tlGoals: TLGoal[]; hasMin: boolean } {
  const hasMin = p.goals.some((g) => g.minute);
  const maxMin = Math.max(1, ...p.goals.map((g) => parseMin(g.minute)));
  const tlGoals: TLGoal[] = p.goals.map((g) => ({
    team: g.team,
    min: g.minute ?? null,
    posPct: hasMin ? (parseMin(g.minute) / maxMin) * 100 : 0,
    scorer: dn(g.scorer),
    sub: getPlayer(g.scorer)?.status === "emergency_sub",
    teamName: g.team === "home" ? p.homeTeam.name : p.awayTeam.name,
    assist: g.assist ? dn(g.assist) : null,
    keeper: g.scoredAgainst ? dn(g.scoredAgainst) : null,
    after: g.scoreAfter ?? null,
  }));
  for (let i = 1; i < tlGoals.length; i++) {
    if (tlGoals[i].posPct <= tlGoals[i - 1].posPct + 1.5) {
      tlGoals[i].posPct = Math.min(100, tlGoals[i - 1].posPct + 3.5);
    }
  }
  return { tlGoals, hasMin };
}

function MatchCard({ p, num }: { p: Partido; num: number }) {
  const ca = teamColor(p.homeTeam.colors);
  const cb = teamColor(p.awayTeam.colors);
  const leg = legLabel(p.leg);
  const { tlGoals, hasMin } = buildTlGoals(p);

  return (
    <div className="jblock">
      <div className="jblock-h">
        <span className="ic">⚽</span>
        <span className="t">{leg ? `${leg} · ` : ""}{p.homeTeam.name} vs {p.awayTeam.name}</span>
      </div>
      <div className="vs-header" style={{ ["--ca" as string]: ca, ["--cb" as string]: cb, minHeight: 170 }}>
        <div className="vs-bg"><div className="half l" /><div className="half r" /></div>
        <div className="vs-veil" />
        <div className="vs-stage">
          <div className="vs-team home">
            <div className="tt">{p.homeTeam.name}</div>
            <div className="cp"><span className="dot" style={{ background: ca }} />cap. <b>{dn(p.homeTeam.captain)}</b></div>
          </div>
          <div className="vs-center">
            <div className="score"><span className="h">{p.result.home}</span><span className="sep">·</span><span className="a">{p.result.away}</span></div>
          </div>
          <div className="vs-team away">
            <div className="tt">{p.awayTeam.name}</div>
            <div className="cp"><span className="dot" style={{ background: cb }} />cap. <b>{dn(p.awayTeam.captain)}</b></div>
          </div>
        </div>
      </div>

      {p.pending?.note && (
        <div className="callout note" style={{ marginTop: 14 }}>
          <span className="ci">⏳</span>
          <div className="cd">{p.pending.note}</div>
        </div>
      )}

      {p.goals.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <GoalTimeline goals={tlGoals} hasMin={hasMin} homeName={p.homeTeam.name} awayName={p.awayTeam.name} />
        </div>
      )}

      {p.mvps.length > 0 ? (
        <div className="mvp-wrap" style={{ marginTop: 14 }}>
          {p.mvps.map((m, i) =>
            m.type === "honorary" ? (
              <div key={i} className="mvp honor">
                <div className="info">
                  <span className="badge-oro">🐊 Caimán de Oro Honorífico</span>
                  <div className="mname">{dn(m.playerId)}</div>
                  <div className="mrole">{m.notes ?? ""}</div>
                </div>
              </div>
            ) : (
              <Link key={i} href={`/jugador/${m.playerId}`} className="mvp">
                <div className="photo"><PlayerAvatar id={m.playerId} fill /><div className="pveil" /></div>
                <div className="info">
                  <span className="badge-oro">🐊 Caimán de Oro · J{num}{leg ? ` · ${leg}` : ""}</span>
                  <div className="mname">{dn(m.playerId)}</div>
                  <div className="mrole">MVP por votación del grupo</div>
                </div>
              </Link>
            )
          )}
        </div>
      ) : (
        <div className="table-note" style={{ marginTop: 14 }}>MVP pendiente</div>
      )}
    </div>
  );
}

export type JornadaDetailViewProps = {
  jornada: Jornada;
  allNumbers: number[];
  prevNumber: number | null;
  nextNumber: number | null;
  /** p.ej. "/jornadas" (temporada activa) o "/temporadas/1/jornadas" (archivo). */
  basePath: string;
  /** Resuelto por el caller vía lib/season-media.ts (fs es server-only). */
  poster: string | null;
  jornadaStats: { total: number; avg: number; pct: number };
  top5: { id: string; name: string; pts: number; delta: number | "new" }[];
  /** p.ej. "Archivo · Temporada 1" — si se pasa, se muestra junto al título. */
  archivedLabel?: string;
  /** p.ej. "T2" — si se pasa (temporadas distintas de la 1), se antepone a "Jornada N". */
  jornadaPrefix?: string;
};

export function JornadaDetailView({
  jornada: j,
  allNumbers,
  prevNumber,
  nextNumber,
  basePath,
  poster,
  jornadaStats: stats,
  top5,
  archivedLabel,
  jornadaPrefix,
}: JornadaDetailViewProps) {
  const num = j.number;
  const jTitle = (n: number) => (jornadaPrefix ? `${jornadaPrefix} · Jornada ${n}` : `Jornada ${n}`);
  const jShort = (n: number) => (jornadaPrefix ? `${jornadaPrefix} · J${n}` : `J${n}`);
  const partidos = getPartidos(j);
  const multi = partidos.length > 1;
  const dateStr = j.date
    ? new Date(j.date + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }).toUpperCase()
    : "FECHA PENDIENTE";

  const { total, avg, pct } = stats;
  const up = pct >= 0;
  const maxBar = Math.max(total, avg);

  // caso simple (hoy, todas las jornadas de T1): un único partido, misma vista de siempre
  const single = !multi ? partidos[0] : null;
  const singleCa = single ? teamColor(single.homeTeam.colors) : "";
  const singleCb = single ? teamColor(single.awayTeam.colors) : "";
  const singleTl = single ? buildTlGoals(single) : null;

  const { teams: globalTeams } = jornadaTeamsSummary(j);

  const statsBlock = (
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
  );

  return (
    <div className="lc-container" style={{ paddingBottom: 44 }}>
      <header className="phero" style={{ paddingBottom: 10 }}>
        <h1 className="big gradient-text">Jornadas</h1>
        <div className="sub">
          {archivedLabel ? `${archivedLabel} · ` : ""}Cada caimana, al detalle · goles, MVP y cómo movió las tablas
        </div>
      </header>

      {/* selector */}
      <div className="jnav">
        <div className="jpills">
          {allNumbers.map((n) => (
            <Link key={n} href={`${basePath}/${n}`} className={`jpill${n === num ? " active" : ""}`}>
              {n}
            </Link>
          ))}
        </div>
        <div className="jnav-btns">
          <Link href={prevNumber ? `${basePath}/${prevNumber}` : "#"} className={`jbtn${prevNumber ? "" : " disabled"}`}>← Anterior</Link>
          <Link href={nextNumber ? `${basePath}/${nextNumber}` : "#"} className={`jbtn${nextNumber ? "" : " disabled"}`}>Siguiente →</Link>
        </div>
      </div>

      {single ? (
        <>
          {/* cabecera cinemática — caso de un único partido */}
          {poster ? (
            <>
              <div className="vs-poster-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={poster} alt={`${j.narrative ?? jTitle(num)} · ${single.homeTeam.name} vs ${single.awayTeam.name}`} />
                <div className="pe" />
              </div>
              <div className="jscore">
                <div className="js-meta">
                  <div className="narr">{j.narrative ?? jTitle(num)}</div>
                  <div className="dt">{jTitle(num)} · {dateStr} · {total} goles</div>
                </div>
                <div className="jt home">
                  {single.homeTeam.name}
                  <span className="cp"><span className="dot" style={{ background: singleCa }} />cap. {dn(single.homeTeam.captain)}</span>
                </div>
                <div className="js-sc"><span className="h">{single.result.home}</span><span className="s">-</span><span className="a">{single.result.away}</span></div>
                <div className="jt away">
                  {single.awayTeam.name}
                  <span className="cp"><span className="dot" style={{ background: singleCb }} />cap. {dn(single.awayTeam.captain)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="vs-header" style={{ ["--ca" as string]: singleCa, ["--cb" as string]: singleCb }}>
              <div className="vs-bg"><div className="half l" /><div className="half r" /></div>
              <div className="vs-veil" />
              <div className="vs-spark" />
              <div className="vs-meta">
                <div className="narr">{j.narrative ?? jTitle(num)}</div>
                <div className="dt">{jTitle(num)} · {dateStr}</div>
              </div>
              <div className="vs-stage">
                <div className="vs-team home">
                  <div className="tt">{single.homeTeam.name}</div>
                  <div className="cp"><span className="dot" style={{ background: singleCa }} />cap. <b>{dn(single.homeTeam.captain)}</b></div>
                </div>
                <div className="vs-center">
                  <div className="score"><span className="h">{single.result.home}</span><span className="sep">·</span><span className="a">{single.result.away}</span></div>
                  <div className="vslabel">VS</div>
                </div>
                <div className="vs-team away">
                  <div className="tt">{single.awayTeam.name}</div>
                  <div className="cp"><span className="dot" style={{ background: singleCb }} />cap. <b>{dn(single.awayTeam.captain)}</b></div>
                </div>
              </div>
              <div className="vs-foot">{total} goles · {single.goals.length} anotaciones registradas</div>
            </div>
          )}

          {/* cronología */}
          <div className="jblock">
            <div className="jblock-h"><span className="ic">⏱️</span><span className="t">Cronología de goles</span><span className="hint">hover / tap en cada gol</span></div>
            <GoalTimeline goals={singleTl!.tlGoals} hasMin={singleTl!.hasMin} homeName={single.homeTeam.name} awayName={single.awayTeam.name} />
          </div>

          {statsBlock}

          {/* MVP */}
          {single.mvps.length > 0 && (
            <div className="jblock">
              <div className="jblock-h"><span className="ic">🐊</span><span className="t">MVP de la jornada</span></div>
              <div className="mvp-wrap">
                {single.mvps.map((m, i) => {
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
                  const g = single.goals.filter((x) => x.countsForStats && x.scorer === m.playerId).length;
                  const a = single.goals.filter((x) => x.countsForStats && x.assist === m.playerId).length;
                  return (
                    <Link key={i} href={`/jugador/${m.playerId}`} className="mvp">
                      <div className="photo"><PlayerAvatar id={m.playerId} fill /><div className="pveil" /></div>
                      <div className="info">
                        <span className="badge-oro">🐊 Caimán de Oro · {jShort(num)}</span>
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
        </>
      ) : (
        <>
          {/* cabecera — jornada con varios partidos (p.ej. ida y vuelta) */}
          <header className="phero" style={{ paddingBottom: 4, paddingTop: 0 }}>
            <div className="sub">{j.narrative ?? jTitle(num)} · {dateStr}</div>
          </header>
          {partidos.map((p, i) => (
            <MatchCard key={i} p={p} num={num} />
          ))}

          {/* resultado global */}
          <div className="jblock">
            <div className="jblock-h"><span className="ic">🌐</span><span className="t">Resultado global</span></div>
            {globalTeams.length === 2 && (
              <div className="vs-header" style={{ ["--ca" as string]: teamColor(globalTeams[0].colors), ["--cb" as string]: teamColor(globalTeams[1].colors), minHeight: 150 }}>
                <div className="vs-bg"><div className="half l" /><div className="half r" /></div>
                <div className="vs-veil" />
                <div className="vs-stage">
                  <div className="vs-team home"><div className="tt">{globalTeams[0].name}</div></div>
                  <div className="vs-center">
                    <div className="score"><span className="h">{globalTeams[0].goalsFor}</span><span className="sep">·</span><span className="a">{globalTeams[1].goalsFor}</span></div>
                  </div>
                  <div className="vs-team away"><div className="tt">{globalTeams[1].name}</div></div>
                </div>
              </div>
            )}
            {j.tieResolution && (
              <div className="callout note" style={{ marginTop: 14 }}>
                <span className="ci">🐊</span>
                <div className="cd">{j.tieResolution.note ?? `Empate global · cada jugador que participó recibe ${j.tieResolution.pointsEach} puntos.`}</div>
              </div>
            )}
          </div>

          {statsBlock}
        </>
      )}

      {/* YouTube — solo si hay enlace */}
      {j.episode.youtubeId && (
        <div className="jblock">
          <div className="jblock-h"><span className="ic">▶️</span><span className="t">Episodio completo</span></div>
          <div className="yt">
            <iframe
              src={`https://www.youtube.com/embed/${j.episode.youtubeId}`}
              title={j.episode.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* cambios en tablas */}
      <div className="jblock">
        <div className="jblock-h"><span className="ic">🔀</span><span className="t">Lo que cambió en las tablas</span><span className="hint">Top 5 tras la {jShort(num)}</span></div>
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
