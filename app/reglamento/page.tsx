import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Reglamento — Liga Caimán",
  description: "Documento oficial de las reglas de la Liga Caimán: incorporaciones, ciclo semanal, pagos, día del partido, reglas de juego y capitanías.",
};

const TOC = [
  { id: "s1", n: "01", label: "Incorporación" },
  { id: "s2", n: "02", label: "Ciclo" },
  { id: "s3", n: "03", label: "Pago" },
  { id: "s4", n: "04", label: "Día" },
  { id: "s5", n: "05", label: "Estructura" },
  { id: "s6", n: "06", label: "Reglas" },
  { id: "s7", n: "07", label: "Capitanías" },
];

export default function ReglamentoPage() {
  return (
    <div className="lc-container" style={{ paddingBottom: 30 }}>
      <header className="doc-hero">
        <div className="kick" style={{ fontFamily: "var(--f-body)", fontWeight: 800, fontSize: 12, letterSpacing: 4, textTransform: "uppercase", color: "var(--mut)" }}>
          Documento oficial · actualizado tras J5
        </div>
        <h1 className="big gradient-text">Reglamento</h1>
        <div className="sub">Cómo funciona la Liga Caimán: del primer día de un fichaje al pitido final.</div>
        <nav className="toc">
          {TOC.map((t) => (
            <a key={t.id} href={`#${t.id}`}><b>{t.n}</b>{t.label}</a>
          ))}
        </nav>
      </header>

      <main>
        {/* 01 */}
        <section className="rsection" id="s1">
          <div className="rsec-head"><span className="no">01</span><span className="ic">📋</span><span className="ti">Incorporación de nuevos jugadores</span></div>
          <p className="rp">Liga Caimán es un <b>grupo cerrado</b>. Para incorporar a un nuevo miembro existe un proceso de tres pasos:</p>
          <div className="rsteps">
            <div className="rstep"><div className="sn">1</div><div><div className="st">Lista de espera</div><div className="sd">Para meter a un amigo al grupo, hay que avisar a Juan Meza para que lo agregue a la lista de espera oficial.</div></div></div>
            <div className="rstep"><div className="sn">2</div><div><div className="st">Primera caimana</div><div className="sd">Cuando falten jugadores en alguna jornada, se llama a las personas de la lista de espera en orden. Quien fue añadido primero tiene prioridad.</div></div></div>
            <div className="rstep"><div className="sn">3</div><div><div className="st">Votación</div><div className="sd">Tras su primera partida se vota en un chat aparte. Solo si la votación es positiva, el nuevo jugador entra al grupo principal de WhatsApp.</div></div></div>
          </div>
          <div className="rsub">Opciones de la votación</div>
          <div className="vote-opts">
            <div className="y">▸ <b>Nos cayó bien</b> → se incorpora al grupo oficial</div>
            <div className="n">▸ <b>Nos pareció problemático</b> → no entra</div>
            <div className="n">▸ <b>No nos gustó</b> → no entra</div>
          </div>
          <Link className="tab" href="/lista-espera" style={{ textDecoration: "none", display: "inline-flex" }}>🎟️ Ver lista de espera actual →</Link>
        </section>

        {/* 02 */}
        <section className="rsection" id="s2">
          <div className="rsec-head"><span className="no">02</span><span className="ic">📅</span><span className="ti">Ciclo semanal</span></div>
          <div className="rsub">2.1 · Encuesta de disponibilidad</div>
          <p className="rp">Cada semana se envía una poll al chat general para verificar disponibilidad del fin de semana.</p>
          <ul className="rlist">
            <li><b>Días:</b> Viernes / Sábado / Domingo</li>
            <li><b>Bloques horarios:</b> Mañana / Tarde / Noche</li>
          </ul>
          <div className="callout info"><span className="ci">📌</span><div><div className="ct">Criterio de viabilidad</div><div className="cd">Si al menos <b>12 personas</b> coinciden en un mismo bloque día-horario, se reserva la cancha en ese horario.</div></div></div>
          <div className="rsub">2.2 · Convocatoria</div>
          <p className="rp">Una vez reservada la cancha, se publica la convocatoria en el chat de anuncios de la liga.</p>
          <ul className="rlist">
            <li>Las primeras <b>16 personas</b> que interactúen reservan su lugar</li>
            <li>A partir de la <b>17ª persona</b> quedan en lista de espera de esa jornada</li>
            <li>La lista de espera de la jornada es <b>distinta</b> a la lista de espera de la liga (sección 1)</li>
          </ul>
        </section>

        {/* 03 */}
        <section className="rsection" id="s3">
          <div className="rsec-head"><span className="no">03</span><span className="ic">💸</span><span className="ti">Pago</span></div>
          <ul className="rlist">
            <li><b>Destinatario:</b> Juan Meza</li>
            <li><b>Plazo:</b> 48 horas para pagar desde que se reserva el lugar</li>
          </ul>
          <div className="callout warn"><span className="ci">⚠️</span><div><div className="ct">Si no pagas en 48 horas</div><div className="cd">Pierdes tu lugar en la convocatoria. Tu plaza pasa a estar disponible para otro miembro del grupo que haya quedado fuera, o para una persona de la lista de espera externa.</div></div></div>
          <div className="callout note"><span className="ci">💬</span><div><div className="cd"><i>El pago incluye 0,50 € extra destinados a la producción audiovisual del canal y &ldquo;las cosas estúpidas que le gusta hacer al presi de la liga&rdquo;.</i></div></div></div>
        </section>

        {/* 04 */}
        <section className="rsection" id="s4">
          <div className="rsec-head"><span className="no">04</span><span className="ic">🏟️</span><span className="ti">Día del partido</span></div>
          <div className="rsub">4.1 · Hora de inicio</div>
          <p className="rp">El partido empieza <b>10 minutos después</b> de la hora reservada de cancha. Esos 10 minutos son para calentar — <i>no</i> son un margen de cortesía para llegar tarde.</p>
          <div className="rsub">4.2 · Llegadas tarde</div>
          <p className="rp">Si un jugador convocado llega después del inicio del partido:</p>
          <ul className="rlist"><li>Su equipo juega con <b>7 jugadores</b> hasta que aparezca</li></ul>
          <div className="callout warn"><span className="ci">⚠️</span><div><div className="ct">Castigo: cola de baja prioridad</div><div className="cd">Si la llegada tarde hace que su equipo juegue con uno menos, el jugador entra en la <b>cola de baja prioridad</b> para la siguiente convocatoria: tendrá que esperar <b>24 horas</b> antes de poder apuntarse a la próxima caimana.</div></div></div>
          <div className="callout warn"><span className="ci">💸</span><div><div className="ct">Bajas de última hora</div><div className="cd">Quien se dé de baja de la convocatoria con poco margen de tiempo, o no consiga quién lo sustituya, <b>paga su parte de la cancha</b> igualmente.</div></div></div>
          <p className="rp" style={{ color: "var(--mut)" }}>Estas reglas protegen al equipo afectado y desincentivan las llegadas tarde y las bajas de última hora.</p>
        </section>

        {/* 05 */}
        <section className="rsection" id="s5">
          <div className="rsec-head"><span className="no">05</span><span className="ic">🧩</span><span className="ti">Estructura del partido</span></div>
          <div className="rsub">5.1 · Tiempos de juego</div>
          <div className="chips">
            <div className="chip"><div className="cv">3 × 30&apos;</div><div className="cl">tres tiempos de 30 min</div></div>
            <div className="chip"><div className="cv">5&apos;</div><div className="cl">pausa entre cada tiempo</div></div>
          </div>
          <div className="rsub">5.2 · Flexibilidad</div>
          <p className="rp">Estas duraciones pueden variar según el cansancio colectivo o las circunstancias del día (clima, lesiones, ritmo del partido).</p>
          <div className="rsub">5.3 · Tiempo final</div>
          <p className="rp">Los últimos 5–10 minutos del horario reservado se destinan a una de estas dos cosas:</p>
          <ul className="rlist">
            <li><b>Penaltis de desempate</b> en caso de empate, para decidir al ganador</li>
            <li><b>Tanda para definir capitanes</b> de la siguiente caimana (innovación introducida en J5)</li>
          </ul>
        </section>

        {/* 06 */}
        <section className="rsection" id="s6">
          <div className="rsec-head"><span className="no">06</span><span className="ic">⚖️</span><span className="ti">Reglas de juego</span></div>
          <div className="rsub">6.1 · Faltas</div>
          <ul className="rlist">
            <li>Todas las faltas se cobran como <b>tiro libre</b>, sin excepción</li>
            <li>No se aplican <b>tarjetas</b> amarillas ni rojas oficiales</li>
          </ul>
          <div className="callout info"><span className="ci">📌</span><div><div className="ct">Sobre el sistema de &ldquo;infractor&rdquo;</div><div className="cd">Los badges y tarjetas amarillas animadas que aparecen en los TikToks son solo contenido audiovisual y narrativo. <b>No tienen efecto deportivo</b> en la liga.</div></div></div>
        </section>

        {/* 07 */}
        <section className="rsection" id="s7">
          <div className="rsec-head"><span className="no">07</span><span className="ic">🎖️</span><span className="ti">Capitanías y formación</span></div>
          <div className="rsub">7.1 · Selección de capitanes</div>
          <p className="rp">Cada caimana hay capitanes diferentes. Tradicionalmente se eligen en el chat antes del partido, aunque desde la <b>Jornada 5</b> también puede definirse mediante tanda de penaltis al final del partido anterior: el ganador de la tanda es capitán de la siguiente jornada y elige primero en el draft.</p>
          <div className="rsub">7.2 · Formación de equipos</div>
          <p className="rp">Los capitanes hacen el draft seleccionando de entre los <b>16 jugadores</b> convocados que asistieron a esa caimana.</p>
          <div className="rsub">7.3 · Identidad del equipo</div>
          <p className="rp">Los capitanes deciden:</p>
          <ul className="rlist">
            <li><b>Nombre del equipo</b> para esa jornada (suelen ser temáticos, con juego de palabras o referencias culturales)</li>
            <li><b>Color de la camiseta</b> para diferenciar a ambos equipos durante el partido</li>
          </ul>
          <p className="rp" style={{ color: "var(--mut)" }}>Esta identidad se mantiene solo para esa jornada — la siguiente caimana habrá nuevos equipos con nuevos nombres y colores.</p>
        </section>

        {/* complementarios */}
        <section className="rsection">
          <div className="rsec-head"><span className="ic">✨</span><span className="ti">Sistemas complementarios</span></div>
          <p className="rp">Además del partido, la liga tiene tres sistemas que viven en sus propias tablas.</p>
          <div className="sys-grid">
            <Link className="sys" href="/tablas?tab=caiman"><div className="si">🐊</div><div className="st">Caimán de Oro</div><div className="sd">MVP por votación abierta del grupo al final de cada caimana.</div></Link>
            <Link className="sys" href="/tablas?tab=global"><div className="si">📊</div><div className="st">Ranking Global</div><div className="sd">Cada capitán entrega su ranking de la liga, normalizado 0–100.</div></Link>
            <Link className="sys" href="/tablas?tab=goleadores"><div className="si">🛡️</div><div className="st">Suplentes de emergencia</div><div className="sd">Reglas especiales para jugadores externos que cubren ausencias.</div></Link>
          </div>
          <div className="spirit">
            <div className="st">Espíritu de la liga</div>
            <p>Liga Caimán es una liga amateur con espíritu de comunidad. Algunas reglas pueden adaptarse por consenso del grupo ante situaciones excepcionales (lesiones de última hora, sustitutos invitados, clima…).</p>
            <p className="quote">&ldquo;Las reglas existen para que la liga funcione. Si una regla impide que la liga funcione bien, se discute y se adapta.&rdquo;</p>
          </div>
          <div className="wait-foot" style={{ marginTop: 24 }}>Última revisión: tras Jornada 5 · @tandemxports</div>
        </section>
      </main>
    </div>
  );
}
