import { redirect } from "next/navigation";
import { jornadas } from "@/lib/stats";

export default function JornadasIndex() {
  const last = jornadas[jornadas.length - 1].number;
  redirect(`/jornadas/${last}`);
}
