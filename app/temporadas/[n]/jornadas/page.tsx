import { redirect, notFound } from "next/navigation";
import { getSeasonByNumber } from "@/lib/seasons";
import { getSeasonBundle } from "@/lib/season-data";

export default async function TemporadaJornadasIndex({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const season = getSeasonByNumber(Number(n));
  if (!season || season.status !== "archivada") notFound();

  const jornadas = getSeasonBundle(season.dataDir).jornadas;
  if (jornadas.length === 0) notFound();
  redirect(`/temporadas/${season.number}/jornadas/${jornadas[jornadas.length - 1].number}`);
}
