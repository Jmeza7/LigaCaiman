import type { Jornada, Partido, Team, Goal, MVP } from "@/lib/types";

/**
 * Devuelve los partidos de una jornada. Si la jornada usa la forma nueva
 * (`partidos`), se devuelve tal cual; si usa la forma heredada de T1 (campos
 * planos homeTeam/awayTeam/result/goals/mvps), se sintetiza un único Partido.
 * Todo el código que lea goles/equipos/resultado de una jornada debe pasar
 * por aquí — nunca leer los campos planos directamente.
 */
export function getPartidos(j: Jornada): Partido[] {
  if (j.partidos) return j.partidos;
  return [
    {
      leg: null,
      homeTeam: j.homeTeam!,
      awayTeam: j.awayTeam!,
      result: j.result!,
      goals: j.goals ?? [],
      mvps: j.mvps ?? [],
      pending: null,
    },
  ];
}

export function isMultiLeg(j: Jornada): boolean {
  return getPartidos(j).length > 1;
}

/** Suma de goles de todos los partidos de la jornada (ambos equipos, ambas vueltas si las hay). */
export function jornadaTotalGoals(j: Jornada): number {
  return getPartidos(j).reduce((acc, p) => acc + p.result.home + p.result.away, 0);
}

/** Todos los goles de la jornada, de todos sus partidos, en un solo array. */
export function allGoalsIn(j: Jornada): Goal[] {
  return getPartidos(j).flatMap((p) => p.goals);
}

/** Todos los MVPs de la jornada, de todos sus partidos. */
export function allMvpsIn(j: Jornada): MVP[] {
  return getPartidos(j).flatMap((p) => p.mvps);
}

export type TeamSummary = { name: string; captain: string; colors: Team["colors"]; goalsFor: number; goalsAgainst: number };

/**
 * Agrega los partidos de una jornada por NOMBRE de equipo (no por home/away,
 * que puede invertirse entre ida y vuelta) — para mostrar un resultado
 * "global" cuando hay más de un partido. Con un único partido, equivale
 * simplemente a sus dos equipos tal cual.
 */
export function jornadaTeamsSummary(j: Jornada): { teams: TeamSummary[]; isMultiLeg: boolean } {
  const partidos = getPartidos(j);
  const byName = new Map<string, TeamSummary>();
  for (const p of partidos) {
    for (const [team, goalsFor, goalsAgainst] of [
      [p.homeTeam, p.result.home, p.result.away] as const,
      [p.awayTeam, p.result.away, p.result.home] as const,
    ]) {
      const existing = byName.get(team.name);
      if (existing) {
        existing.goalsFor += goalsFor;
        existing.goalsAgainst += goalsAgainst;
      } else {
        byName.set(team.name, { name: team.name, captain: team.captain, colors: team.colors, goalsFor, goalsAgainst });
      }
    }
  }
  return { teams: Array.from(byName.values()), isMultiLeg: partidos.length > 1 };
}

export type Outcome = "W" | "L" | "T" | null;

/**
 * Resultado de un jugador en una jornada completa: "W"/"L"/"T" si jugó algún
 * partido de ella, null si no jugó ninguno. Cuando la jornada tiene
 * `tieResolution`, el resultado es siempre "T" para cualquiera que haya
 * participado en algún partido, independientemente de cómo quedara ese
 * partido en concreto (así es como se decidió repartir los puntos).
 */
export function outcomeFor(j: Jornada, id: string): { outcome: Outcome; team: Team | null; opp: Team | null } {
  const partidos = getPartidos(j);
  const appearances = partidos.filter((p) => p.homeTeam.players.includes(id) || p.awayTeam.players.includes(id));
  if (appearances.length === 0) return { outcome: null, team: null, opp: null };

  const first = appearances[0];
  const onHome = first.homeTeam.players.includes(id);
  const team = onHome ? first.homeTeam : first.awayTeam;
  const opp = onHome ? first.awayTeam : first.homeTeam;

  if (j.tieResolution) {
    return { outcome: "T", team, opp };
  }

  const won = onHome ? first.result.home > first.result.away : first.result.away > first.result.home;
  const tied = first.result.home === first.result.away;
  return { outcome: tied ? "T" : won ? "W" : "L", team, opp };
}

/** ¿Participó este jugador en algún partido de la jornada? */
export function playedIn(j: Jornada, id: string): boolean {
  return getPartidos(j).some((p) => p.homeTeam.players.includes(id) || p.awayTeam.players.includes(id));
}
