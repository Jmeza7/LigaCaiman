import { redirect } from "next/navigation";
import { getActiveSeason } from "@/lib/seasons";
import { getSeasonBundle } from "@/lib/season-data";

export default function JornadasIndex() {
  const season = getActiveSeason();
  const jornadas = getSeasonBundle(season.dataDir).jornadas;
  if (jornadas.length === 0) redirect("/");
  redirect(`/jornadas/${jornadas[jornadas.length - 1].number}`);
}
