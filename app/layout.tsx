import type { Metadata } from "next";
import Link from "next/link";
import { Space_Grotesk, JetBrains_Mono, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jet",
  display: "swap",
});
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Liga Caimán — Tandem Xports",
  description:
    "La liga amateur de fútbol 7 más épica de Madrid. Estadísticas, jornadas y clasificaciones. No medimos equipos, medimos jugadores.",
  keywords: ["Liga Caimán", "Tandem Xports", "fútbol 7", "Madrid"],
  openGraph: {
    title: "Liga Caimán — Tandem Xports",
    description: "No medimos equipos, medimos jugadores. Fútbol 7 · Madrid.",
    type: "website",
  },
};

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/jornadas", label: "Jornadas" },
  { href: "/tablas", label: "Tablas" },
  { href: "/temporadas", label: "Temporadas" },
  { href: "/hall-of-fame", label: "Hall of Fame" },
  { href: "/reglamento", label: "Reglas" },
  { href: "/lista-espera", label: "Espera" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${jetbrains.variable} ${hanken.variable} h-full antialiased`}>
      <body className="min-h-screen flex flex-col">
        <div className="bg-fx" aria-hidden />
        <div className="relative z-[1] flex flex-col min-h-screen">
          <nav className="lc-nav">
            <div className="lc-nav-in">
              <Link href="/" className="lc-logo">
                <span className="mark">🐊</span>
                <span className="name display">
                  <span className="a">LIGA</span> <span className="b">CAIMÁN</span>
                </span>
              </Link>
              <div className="lc-nav-links">
                {NAV.map((l) => (
                  <Link key={l.href} href={l.href}>
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          <main className="flex-1 w-full">{children}</main>

          <footer className="lc-footer">
            <div className="lc-container">
              <p className="motto display">No medimos equipos, medimos jugadores</p>
              <p className="sub">
                Liga Caimán ·{" "}
                <a href="https://www.youtube.com/@tandemxports" target="_blank" rel="noreferrer">
                  Tandem Xports
                </a>
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
