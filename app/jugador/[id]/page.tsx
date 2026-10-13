import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { players, getPlayer, createSeasonStats, type FullProfile } from "@/lib/stats";
import { getActiveSeason } from "@/lib/seasons";
import { getSeasonBundle } from "@/lib/season-data";
import ProfileView from "./ProfileView";

export function generateStaticParams() {
  return players.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = getPlayer(id);
  return {
    title: p ? `${p.displayName} — Liga Caimán` : "Jugador — Liga Caimán",
    description: p ? `Perfil, cromo y estadísticas de ${p.displayName} en la Liga Caimán.` : undefined,
  };
}

function buildAchievements(p: FullProfile, leagueMaxGoals: number) {
  const maxJ = p.history.reduce((m, h) => Math.max(m, h.g), 0);
  const isTop = p.goals > 0 && p.goals === leagueMaxGoals;
  const A = [
    { id: "debut", name: "Debut", desc: "Jugó su primera caimana", icon: "🌱", got: p.played > 0, rare: "common" },
    { id: "pichichi", name: "Pichichi", desc: "Máximo goleador de la liga", icon: "⚽", got: isTop, rare: "gold" },
    { id: "oro", name: "Caimán de Oro", desc: p.oro ? `${p.oro} vez(es) MVP` : "Ser MVP de una jornada", icon: "🐊", got: p.oro > 0, rare: "gold" },
    { id: "rank1", name: "Nº1 del ranking", desc: "Liderar el ranking global", icon: "👑", got: p.rankPos === 1, rare: "gold" },
    { id: "invicto", name: "Invicto", desc: "Temporada sin perder", icon: "🛡️", got: p.unbeaten, rare: "gold" },
    { id: "manita", name: "Manita", desc: "5 goles en una jornada", icon: "🖐️", got: maxJ >= 5, rare: "epic" },
    { id: "hat", name: "Hat-trick", desc: "3+ goles en una jornada", icon: "🎩", got: maxJ >= 3, rare: "epic" },
    { id: "doble", name: "Doble dígito", desc: "10+ goles en la temporada", icon: "🔟", got: p.goals >= 10, rare: "rare" },
    { id: "asist", name: "Asistente", desc: "5+ asistencias", icon: "🎯", got: p.assists >= 5, rare: "rare" },
    { id: "muro", name: "El Muro", desc: "Portero: < 3 goles/partido", icon: "🧤", got: !!(p.keeper && p.keeper.avg < 3), rare: "epic" },
  ];
  const got = A.filter((a) => a.got);
  const locked = A.filter((a) => !a.got && a.id !== "muro");
  const showLocked = p.keeper ? A.filter((a) => !a.got) : locked;
  return got.concat(showLocked).slice(0, 10);
}

export default async function JugadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const season = getActiveSeason();
  const stats = createSeasonStats(getSeasonBundle(season.dataDir), season.config);

  const p = stats.buildFullProfile(id);
  if (!p) notFound();

  const order = stats.playerOrder();
  const leagueMaxGoals = stats.computeGoalscorers()[0]?.goals ?? 0;
  const achievements = buildAchievements(p, leagueMaxGoals);

  const rankingsData = stats.rankingsData;
  const rivals = rankingsData.globalRanking
    .filter((r) => r.playerId !== id)
    .slice(0, 3)
    .map((r) => ({
      id: r.playerId,
      name: (getPlayer(r.playerId)?.displayName ?? r.playerId).toUpperCase(),
      tag: `#${rankingsData.globalRanking.findIndex((x) => x.playerId === r.playerId) + 1}`,
      cardStats: stats.cardStatsFor(r.playerId).cardStats,
    }));

  return <ProfileView p={p} order={order} rivals={rivals} achievements={achievements} leagueMaxGoals={leagueMaxGoals} />;
}
