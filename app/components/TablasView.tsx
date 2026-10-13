"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getPlayer } from "@/lib/stats";
import type { RankingsData } from "@/lib/types";

type KeeperRow = { playerId: string; pj: number; conceded: number; avg: number; adj: number; note?: string };

const TABS = [
  { key: "ganadores", ic: "🏆", label: "Ganadores" },
  { key: "goleadores", ic: "⚽", label: "Goleadores" },
  { key: "asistencias", ic: "🎯", label: "Asistencias" },
  { key: "porteros", ic: "🧤", label: "Porteros" },
  { key: "caiman", ic: "🐊", label: "Caimán de Oro" },
  { key: "global", ic: "📊", label: "Ranking Global" },
] as const;
export type TabKey = (typeof TABS)[number]["key"];

const medal = (rk: number) => (rk === 1 ? "🥇" : rk === 2 ? "🥈" : rk === 3 ? "🥉" : "");
const topCls = (rk: number) => (rk <= 3 ? `t${rk}` : "");
const dn = (id: string) => getPlayer(id)?.displayName ?? id;

type StatRow = { id: string; v: number; sub?: boolean; votes?: number; total?: number };

function StatRows({
  rows,
  color,
  note,
  fmt,
}: {
  rows: StatRow[];
  color: string;
  note: React.ReactNode;
  fmt: (r: StatRow) => React.ReactNode;
}) {
  if (rows.length === 0) {
    return <div className="table-note">Todavía no hay datos para esta tabla.</div>;
  }
  const max = Math.max(...rows.map((r) => r.v));
  return (
    <>
      <div className="standings">
        {rows.map((r, i) => {
          const rk = i + 1;
          return (
            <Link key={r.id} href={`/jugador/${r.id}`} className={`statrow ${topCls(rk)}`} style={{ ["--mbar" as string]: color }}>
              <div className="rk">{rk}</div>
              <div className="who">
                <span className="nm">{dn(r.id)}</span>
                {r.sub && <span className="tag sup">SUP</span>}
                {medal(rk) && <span className="medal">{medal(rk)}</span>}
              </div>
              <div className="track"><span style={{ width: `${(r.v / max) * 100}%` }} /></div>
              <div className="v">{fmt(r)}</div>
            </Link>
          );
        })}
      </div>
      {note}
    </>
  );
}

export type TablasViewProps = {
  standings: RankingsData["standings"];
  globalRanking: RankingsData["globalRanking"];
  goleadores: StatRow[];
  asistencias: StatRow[];
  keepersClasificados: KeeperRow[];
  keepersSinClasificar: KeeperRow[];
  oroByJornada: { n: number; narr: string | null; winners: string[]; honor: { playerId: string; notes?: string }[] }[];
  keeperMinPJ: number;
  pointsPerWin: number;
  jornadaCount: number;
  /** Texto bajo el título, p.ej. "tras J9" o "Archivo · Temporada 1". */
  subtitle: string;
  /** Si no es null, se muestra un aviso discreto encima de las pestañas (p.ej. datos de una ida pendientes). */
  pendingNotice?: string | null;
  /** Si es true, la pestaña Ranking Global muestra un aviso de "en revisión" en vez de la tabla. */
  rankingUpdating?: boolean;
};

export function TablasView({
  standings,
  globalRanking,
  goleadores,
  asistencias,
  keepersClasificados,
  keepersSinClasificar,
  oroByJornada,
  keeperMinPJ,
  pointsPerWin,
  jornadaCount,
  subtitle,
  pendingNotice,
  rankingUpdating,
}: TablasViewProps) {
  const sp = useSearchParams();
  const initial = TABS.some((t) => t.key === sp.get("tab")) ? (sp.get("tab") as TabKey) : "ganadores";
  const [tab, setTab] = useState<TabKey>(initial);

  const allKeepers = [...keepersClasificados, ...keepersSinClasificar];
  const keeperMax = allKeepers.length ? Math.max(...allKeepers.map((k) => k.adj)) : 0;

  return (
    <>
      <header className="phero">
        <h1 className="big brand-grad gradient-text">Tablas oficiales</h1>
        <div className="sub">Las 6 clasificaciones · {subtitle}</div>
      </header>

      {pendingNotice && (
        <div className="callout note" style={{ marginBottom: 18 }}>
          <span className="ci">⏳</span>
          <div className="cd">{pendingNotice}</div>
        </div>
      )}

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={`tab${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>
            <span className="ic">{t.ic}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* GANADORES */}
      {tab === "ganadores" && (
        <>
          {standings.length === 0 ? (
            <div className="table-note">Todavía no hay clasificación para esta temporada.</div>
          ) : (
            <>
              <div className="standings">
                {standings.map((p, i) => {
                  const rk = i + 1;
                  const form = p.record.map((r) => (r === "W" ? "W" : r === "L" ? "L" : r === "T" ? "T" : "N"));
                  return (
                    <Link key={p.playerId} href={`/jugador/${p.playerId}`} className={`srow ${rk === 1 ? "top1" : topCls(rk)}`}>
                      <div className="rk">{rk}</div>
                      <div className="who">
                        <span className="nm">{dn(p.playerId)}</span>
                        {p.isUnbeaten && <span className="tag invicto">★ Invicto</span>}
                        {medal(rk) && <span className="medal">{medal(rk)}</span>}
                      </div>
                      <div className="form-mini">
                        {form.map((c, k) => (
                          <span key={k} className={c}>{c === "N" ? "·" : c === "T" ? "E" : c}</span>
                        ))}
                      </div>
                      <div className={`pts${p.points >= 9 ? " lime" : ""}`}>{p.points}</div>
                    </Link>
                  );
                })}
              </div>
              <div className="table-note">
                {standings.length} jugadores · <b>{pointsPerWin} pts</b> por victoria · forma de J1 a J{jornadaCount} (· = no jugó) · toca una fila para ver el perfil
              </div>
            </>
          )}
        </>
      )}

      {/* GOLEADORES */}
      {tab === "goleadores" && (
        <StatRows
          rows={goleadores}
          color="var(--magenta)"
          fmt={(r) => <>{r.v}<small>goles</small></>}
          note={<div className="table-note">Goles que cuentan para estadística · <b>SUP</b> = suplente de emergencia</div>}
        />
      )}

      {/* ASISTENCIAS */}
      {tab === "asistencias" && (
        <StatRows
          rows={asistencias}
          color="var(--cyan)"
          fmt={(r) => <>{r.v}<small>asist.</small></>}
          note={<div className="table-note">Pases de gol confirmados</div>}
        />
      )}

      {/* PORTEROS */}
      {tab === "porteros" && (
        <>
          {allKeepers.length === 0 ? (
            <div className="table-note">Todavía no hay datos de porteros para esta temporada.</div>
          ) : (
            <>
              <div className="standings">
                {keepersClasificados.map((k, i) => {
                  const rk = i + 1;
                  return (
                    <Link key={k.playerId} href={`/jugador/${k.playerId}`} className={`statrow ${topCls(rk)}`} style={{ ["--mbar" as string]: "var(--lime)" }}>
                      <div className="rk">{rk}</div>
                      <div className="who">
                        <span className="nm">{dn(k.playerId)}</span>
                        {k.note && <span className="tag sup">{k.note}</span>}
                        {medal(rk) && <span className="medal">{medal(rk)}</span>}
                      </div>
                      <div className="track"><span style={{ width: `${(1 - k.adj / (keeperMax + 1)) * 100}%` }} /></div>
                      <div className="v">{k.adj.toFixed(2)}<small>aj. · media {k.avg.toFixed(2)} · {k.pj.toFixed(2)} PJ</small></div>
                    </Link>
                  );
                })}
              </div>
              {keepersSinClasificar.length > 0 && (
                <>
                  <div className="table-note" style={{ textAlign: "left", marginTop: 24, marginBottom: 10, fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--mut)" }}>
                    Sin clasificar · menos de {keeperMinPJ.toFixed(2)} PJ
                  </div>
                  <div className="standings" style={{ opacity: 0.75 }}>
                    {keepersSinClasificar.map((k) => (
                      <Link key={k.playerId} href={`/jugador/${k.playerId}`} className="statrow" style={{ ["--mbar" as string]: "var(--mut-2)" }}>
                        <div className="rk">—</div>
                        <div className="who">
                          <span className="nm">{dn(k.playerId)}</span>
                          {k.adj === Math.min(...keepersSinClasificar.map((x) => x.adj)) && <span className="tag sup" style={{ color: "var(--cyan)", borderColor: "rgba(52,230,255,.4)", background: "rgba(52,230,255,.1)" }}>⚡ mejor media</span>}
                        </div>
                        <div className="track"><span style={{ width: `${(1 - k.adj / (keeperMax + 1)) * 100}%` }} /></div>
                        <div className="v">{k.adj.toFixed(2)}<small>aj. · media {k.avg.toFixed(2)} · {k.pj.toFixed(2)} PJ</small></div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
              <div className="table-note">Ordenado por <b>media ajustada</b> = encajados/PJ − 0,30 por cada PJ extra (premia a los que más portean). Menos es mejor · mínimo <b>{keeperMinPJ.toFixed(2)} PJ</b> para clasificar · no cuentan los goles del suplente.</div>
            </>
          )}
        </>
      )}

      {/* CAIMÁN DE ORO */}
      {tab === "caiman" && (
        <>
          {oroByJornada.length === 0 ? (
            <div className="table-note">Todavía no hay Caimanes de Oro en esta temporada.</div>
          ) : (
            <>
              <div className="oro-grid">
                {[...oroByJornada].reverse().map((j) => (
                  <div key={j.n} className="oro-row">
                    <div className="jn">J{j.n}</div>
                    <div>
                      <div className="meta">{j.narr ?? `Jornada ${j.n}`}</div>
                      <div className="winners">
                        {j.winners.map((id, i) => (
                          <span key={id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {i > 0 && <span className="plus">+</span>}
                            <Link href={`/jugador/${id}`} style={{ color: "inherit", textDecoration: "none" }}>{dn(id)}</Link>
                          </span>
                        ))}
                      </div>
                      {j.honor.length > 0 && (
                        <div className="honor">★ {j.honor.map((h) => `${h.playerId === "ximena" ? "Ximena" : dn(h.playerId)}${h.notes ? " · " + h.notes : ""}`).join(" · ")}</div>
                      )}
                    </div>
                    <div className="medal">🐊</div>
                  </div>
                ))}
              </div>
              <div className="table-note">El MVP se vota en abierto al final de cada caimana</div>
            </>
          )}
        </>
      )}

      {/* RANKING GLOBAL */}
      {tab === "global" && (
        rankingUpdating ? (
          <div className="ranking-updating">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/working.png" alt="Estamos actualizando el ranking" />
            <div className="t">Estamos actualizando el ranking</div>
            <div className="d">Los capitanes están revisando sus votos — vuelve pronto para ver la tabla.</div>
          </div>
        ) : (
          <StatRows
            rows={globalRanking.map((r) => ({ id: r.playerId, v: r.score, votes: r.votes, total: r.totalCaptains }))}
            color="var(--violet)"
            fmt={(r) => <>{r.v.toFixed(1)}<small>{r.votes}/{r.total} votos</small></>}
            note={<div className="table-note">Ranking normalizado 0–100 · promedio de los votos de cada capitán · auto-votos excluidos</div>}
          />
        )
      )}
    </>
  );
}

export { TABS };
