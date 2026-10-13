import type { Metadata } from "next";
import Link from "next/link";
import { getPlayer } from "@/lib/stats";
import waitlist from "@/data/waitlist.json";

export const metadata: Metadata = {
  title: "Lista de espera — Liga Caimán",
  description: "Amigos en lista de espera para entrar a la Liga Caimán, por orden de prioridad y con su sponsor.",
};

type Entry = { priority: number; name: string; sponsor: string; note?: string };

export default function ListaEsperaPage() {
  const entries = (waitlist as Entry[]).slice().sort((a, b) => a.priority - b.priority);

  return (
    <div className="lc-container">
      <header className="chero">
        <div className="kick">Incorporaciones · sección 1 del reglamento</div>
        <h1 className="big gradient-text">Lista de espera</h1>
        <div className="sub">
          Amigos esperando para entrar a la liga. Cuando falten jugadores en una jornada, se llama por orden de
          prioridad. Cada uno tiene un <b>sponsor</b>: el miembro que lo mete al grupo.
        </div>
      </header>

      <section style={{ padding: "14px 0 44px" }}>
        <div className="callout info wait-info">
          <span className="ci">📌</span>
          <div>
            <div className="cd">
              La prioridad la marca el orden de llegada a la lista: quien fue añadido primero entra primero. Tras su
              primera caimana, el grupo vota si se queda.{" "}
              <Link href="/reglamento#s1">Ver proceso completo →</Link>
            </div>
          </div>
        </div>

        <div className="wait-list" style={{ marginTop: 18 }}>
          {entries.map((e) => {
            const sponsor = getPlayer(e.sponsor);
            return (
              <div key={e.priority} className="wrow">
                <div className="wn">{e.priority}</div>
                <div>
                  <div className="wname">
                    {e.name}
                    {e.note && <span className="tag pending">⚠ {e.note}</span>}
                  </div>
                  <div className="wsponsor">
                    Sponsor:{" "}
                    {sponsor ? (
                      <Link href={`/jugador/${e.sponsor}`} style={{ color: "var(--ink-2)", fontWeight: 700, textDecoration: "none" }}>
                        {sponsor.displayName}
                      </Link>
                    ) : (
                      <b>{e.sponsor}</b>
                    )}
                  </div>
                </div>
                <div className="gift">🎟️</div>
              </div>
            );
          })}
        </div>
        <div className="wait-foot">{entries.length} amigos en cola · la lista se actualiza cada caimana</div>
      </section>
    </div>
  );
}
