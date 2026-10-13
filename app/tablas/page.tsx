import { Suspense } from "react";
import { getPlayer, keeperAdjusted, createSeasonStats } from "@/lib/stats";
import { getActiveSeason } from "@/lib/seasons";
import { getSeasonBundle } from "@/lib/season-data";
import { TablasView } from "@/app/components/TablasView";

export default function TablasPage() {
  const season = getActiveSeason();
  const stats = createSeasonStats(getSeasonBundle(season.dataDir), season.config);
  const { jornadas, rankingsData } = stats;

  const allKeepers = rankingsData.keepers
    .map((k) => ({ ...k, avg: k.conceded / k.pj, adj: keeperAdjusted(k.conceded, k.pj) }))
    .sort((a, b) => a.adj - b.adj || (getPlayer(a.playerId)?.displayName ?? "").localeCompare(getPlayer(b.playerId)?.displayName ?? ""));

  const oroByJornada = jornadas.map((j) => ({
    n: j.number,
    narr: j.narrative,
    winners: j.mvps.filter((m) => m.type === "normal").map((m) => m.playerId),
    honor: j.mvps.filter((m) => m.type === "honorary"),
  }));

  const goleadores = stats.computeGoalscorers().map((g) => ({ id: g.id, v: g.goals, sub: getPlayer(g.id)?.status === "emergency_sub" }));
  const asistencias = stats.computeAssists().map((a) => ({ id: a.id, v: a.assists, sub: getPlayer(a.id)?.status === "emergency_sub" }));

  return (
    <div className="lc-container" style={{ padding: "8px 28px 44px" }}>
      <Suspense fallback={<div style={{ color: "var(--mut)" }}>Cargando tablas…</div>}>
        <TablasView
          standings={rankingsData.standings}
          globalRanking={rankingsData.globalRanking}
          goleadores={goleadores}
          asistencias={asistencias}
          keepersClasificados={allKeepers.filter((k) => k.pj >= stats.keeperMinPJ)}
          keepersSinClasificar={allKeepers.filter((k) => k.pj < stats.keeperMinPJ)}
          oroByJornada={oroByJornada}
          keeperMinPJ={stats.keeperMinPJ}
          pointsPerWin={stats.pointsPerWin}
          jornadaCount={jornadas.length}
          subtitle={jornadas.length > 0 ? `tras J${jornadas[jornadas.length - 1].number}` : season.name}
        />
      </Suspense>
    </div>
  );
}
