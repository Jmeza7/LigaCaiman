import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSeasonStats } from "@/lib/stats";
import { getActiveSeason } from "@/lib/seasons";
import { getSeasonBundle } from "@/lib/season-data";
import { resolveJornadaMedia } from "@/lib/season-media";
import { JornadaDetailView } from "@/app/components/JornadaDetailView";

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
  const prevNumber = idx > 0 ? jornadas[idx - 1].number : null;
  const nextNumber = idx < jornadas.length - 1 ? jornadas[idx + 1].number : null;
  const media = resolveJornadaMedia(season.number, num);

  return (
    <JornadaDetailView
      jornada={j}
      allNumbers={jornadas.map((x) => x.number)}
      prevNumber={prevNumber}
      nextNumber={nextNumber}
      basePath="/jornadas"
      poster={media.poster}
      mvpPoster={media.mvpPoster}
      jornadaStats={stats.jornadaStats(num)}
      top5={stats.top5After(num)}
      jornadaPrefix={season.number !== 1 ? `T${season.number}` : undefined}
    />
  );
}
