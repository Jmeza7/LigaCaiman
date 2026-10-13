import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSeasonStats } from "@/lib/stats";
import { getArchivedSeasons, getSeasonByNumber } from "@/lib/seasons";
import { getSeasonBundle } from "@/lib/season-data";
import { resolveJornadaMedia } from "@/lib/season-media";
import { JornadaDetailView } from "@/app/components/JornadaDetailView";

export function generateStaticParams() {
  return getArchivedSeasons().flatMap((season) =>
    getSeasonBundle(season.dataDir).jornadas.map((j) => ({ n: String(season.number), j: String(j.number) }))
  );
}

export async function generateMetadata({ params }: { params: Promise<{ n: string; j: string }> }): Promise<Metadata> {
  const { n, j } = await params;
  const season = getSeasonByNumber(Number(n));
  if (!season) return { title: "Jornada — Liga Caimán" };
  const jornada = getSeasonBundle(season.dataDir).jornadas.find((x) => x.number === Number(j));
  return {
    title: jornada
      ? `Jornada ${jornada.number}${jornada.narrative ? " · " + jornada.narrative : ""} — Archivo ${season.name} — Liga Caimán`
      : "Jornada — Liga Caimán",
  };
}

export default async function TemporadaJornadaPage({ params }: { params: Promise<{ n: string; j: string }> }) {
  const { n, j } = await params;
  const season = getSeasonByNumber(Number(n));
  if (!season || season.status !== "archivada") notFound();

  const bundle = getSeasonBundle(season.dataDir);
  const stats = createSeasonStats(bundle, season.config);
  const { jornadas } = bundle;

  const num = Number(j);
  const jornada = jornadas.find((x) => x.number === num);
  if (!jornada) notFound();

  const idx = jornadas.findIndex((x) => x.number === num);
  const prevNumber = idx > 0 ? jornadas[idx - 1].number : null;
  const nextNumber = idx < jornadas.length - 1 ? jornadas[idx + 1].number : null;
  const basePath = `/temporadas/${season.number}/jornadas`;
  const media = resolveJornadaMedia(season.number, num);

  return (
    <JornadaDetailView
      jornada={jornada}
      allNumbers={jornadas.map((x) => x.number)}
      prevNumber={prevNumber}
      nextNumber={nextNumber}
      basePath={basePath}
      poster={media.poster}
      mvpPoster={media.mvpPoster}
      jornadaStats={stats.jornadaStats(num)}
      top5={stats.top5After(num)}
      archivedLabel={`Archivo · ${season.name}`}
    />
  );
}
