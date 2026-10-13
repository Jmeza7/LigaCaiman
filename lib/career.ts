import { getPlayer, createSeasonStats } from "@/lib/stats";
import { getAllSeasons } from "@/lib/seasons";
import { getSeasonBundle } from "@/lib/season-data";
import { buildSeasonHallOfFame, type SeasonAward } from "@/lib/hallOfFame";

export type CareerSeasonRow = {
  seasonId: string;
  seasonLabel: string;
  goals: number;
  assists: number;
  played: number;
  wins: number;
  losses: number;
  points: number;
};

export type CareerTrophy = { seasonId: string; seasonLabel: string; title: string; icon: string };

export type CareerProfile = {
  id: string;
  totals: { goals: number; assists: number; played: number; wins: number; losses: number; points: number };
  bySeason: CareerSeasonRow[];
  trophies: CareerTrophy[];
};

function wonAward(award: SeasonAward, id: string): boolean {
  const top = award.tiers[0];
  return !!top && top.rank === 1 && top.winners.some((w) => w.id === id);
}

/** Construye el historial de carrera de un jugador cruzando todas las temporadas. */
export function buildCareerProfile(id: string): CareerProfile | null {
  const player = getPlayer(id);
  if (!player) return null;

  const totals = { goals: 0, assists: 0, played: 0, wins: 0, losses: 0, points: 0 };
  const bySeason: CareerSeasonRow[] = [];
  const trophies: CareerTrophy[] = [];

  for (const season of getAllSeasons()) {
    const bundle = getSeasonBundle(season.dataDir);
    const stats = createSeasonStats(bundle, season.config);
    const profile = stats.buildFullProfile(id);
    if (!profile || profile.played === 0) continue;

    totals.goals += profile.goals;
    totals.assists += profile.assists;
    totals.played += profile.played;
    totals.wins += profile.wins;
    totals.losses += profile.losses;
    totals.points += profile.points;

    bySeason.push({
      seasonId: season.id,
      seasonLabel: season.name,
      goals: profile.goals,
      assists: profile.assists,
      played: profile.played,
      wins: profile.wins,
      losses: profile.losses,
      points: profile.points,
    });

    if (season.status === "archivada") {
      const hof = buildSeasonHallOfFame(season.id);
      if (hof) {
        const awards: [SeasonAward, string, string][] = [
          [hof.champion, "Campeón", "👑"],
          [hof.pichichi, "Pichichi", "⚽"],
          [hof.asistencias, "Máximo asistente", "🎯"],
          [hof.guanteOro, "Guante de Oro", "🧤"],
          [hof.caimanOro, "Más Caimanes de Oro", "🐊"],
          [hof.rankingGlobal, "Ranking Global nº1", "📊"],
        ];
        for (const [award, title, icon] of awards) {
          if (wonAward(award, id)) trophies.push({ seasonId: season.id, seasonLabel: season.name, title, icon });
        }
      }
    }
  }

  return { id, totals, bySeason, trophies };
}
