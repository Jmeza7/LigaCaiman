"use client";
import { useEffect, useRef, useState } from "react";

export function J6Audio({
  src,
  storageKey = "lc_j6_audio",
  ariaLabel = "Música de la Jornada 6",
  playingLabel = "Sonando · J6",
  nudgeTitle = "Pon el ambiente",
  nudgeText = "Toca para escuchar el tráiler de la J6",
}: {
  src: string;
  storageKey?: string;
  ariaLabel?: string;
  playingLabel?: string;
  nudgeTitle?: string;
  nudgeText?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [nudge, setNudge] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.55;
    const wantOff = localStorage.getItem(storageKey) === "off";
    if (wantOff) return;

    const play = () =>
      audio
        .play()
        .then(() => {
          setPlaying(true);
          setNudge(false);
        })
        .catch(() => Promise.reject());

    play().catch(() => {
      setNudge(true);
      const once = () => {
        if (localStorage.getItem(storageKey) === "off") return cleanup();
        play().then(cleanup).catch(() => {});
      };
      const cleanup = () => {
        window.removeEventListener("pointerdown", once);
        window.removeEventListener("keydown", once);
      };
      window.addEventListener("pointerdown", once);
      window.addEventListener("keydown", once);
    });
  }, [storageKey]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      localStorage.setItem(storageKey, "on");
      audio.play().then(() => { setPlaying(true); setNudge(false); }).catch(() => {});
    } else {
      localStorage.setItem(storageKey, "off");
      audio.pause();
      setPlaying(false);
    }
  };

  return (
    <>
      <button className={`audio-toggle${playing ? " playing" : ""}`} onClick={toggle} aria-label={ariaLabel}>
        <span className="eq"><i /><i /><i /><i /></span>
        <span>{playing ? playingLabel : "Activar música"}</span>
      </button>
      <audio ref={audioRef} src={src} loop preload="auto" />
      {nudge && (
        <button
          onClick={() => { localStorage.setItem(storageKey, "on"); audioRef.current?.play().then(() => { setPlaying(true); setNudge(false); }).catch(() => {}); }}
          style={{
            position: "fixed", right: 20, bottom: 20, zIndex: 60, display: "flex", alignItems: "center", gap: 12,
            padding: "13px 17px", borderRadius: 14, cursor: "pointer", background: "rgba(14,17,22,.92)",
            backdropFilter: "blur(10px)", border: "1px solid rgba(52,230,255,.35)", boxShadow: "0 20px 50px -20px rgba(0,0,0,.8)",
            maxWidth: 280, textAlign: "left",
          }}
        >
          <span style={{ fontSize: 20 }}>🔊</span>
          <span style={{ fontFamily: "var(--f-body)", fontSize: 12.5, lineHeight: 1.35, color: "var(--ink-2)" }}>
            <b style={{ color: "var(--cyan)", display: "block", fontSize: 13 }}>{nudgeTitle}</b>
            {nudgeText}
          </span>
        </button>
      )}
    </>
  );
}
