"use client";
import { useState } from "react";

export type TLGoal = {
  team: "home" | "away";
  min?: string | null;
  posPct: number;
  scorer: string;
  sub: boolean;
  teamName: string;
  assist?: string | null;
  keeper?: string | null;
  after?: { home: number; away: number } | null;
};

export function GoalTimeline({
  goals,
  hasMin,
  homeName,
  awayName,
}: {
  goals: TLGoal[];
  hasMin: boolean;
  homeName: string;
  awayName: string;
}) {
  const [sel, setSel] = useState(0);
  const g = goals[sel];

  return (
    <div className="timeline">
      {hasMin ? (
        <div className="tl-track">
          {goals.map((gg, i) => (
            <div
              key={i}
              className={`tl-goal ${gg.team}${i === sel ? " sel" : ""}`}
              style={{ left: `${gg.posPct}%` }}
              onMouseEnter={() => setSel(i)}
              onClick={() => setSel(i)}
            >
              <span className="min">{gg.min}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="glist">
          {goals.map((gg, i) => (
            <div
              key={i}
              className={`gchip ${gg.team}${i === sel ? " sel" : ""}`}
              onMouseEnter={() => setSel(i)}
              onClick={() => setSel(i)}
            >
              <span className="gd" />
              <span className="gn">{gg.scorer}</span>
            </div>
          ))}
        </div>
      )}

      <div className="tl-legend" style={hasMin ? undefined : { marginTop: 14 }}>
        <span className="k home"><i />{homeName}</span>
        <span className="k away"><i />{awayName}</span>
      </div>

      <div className="tl-detail">
        {g && (
          <>
            <div className="gmin">{g.min ? g.min : "⚽"}</div>
            <div className="gmain">
              <span className="sc">{g.scorer}</span>
              {g.sub && <span style={{ color: "var(--mut-2)", fontSize: 11 }}> (suplente)</span>}
              <br />
              <span style={{ color: "var(--mut)" }}>{g.teamName}</span>
              {g.assist && <> · asist. <span className="as">{g.assist}</span></>}
              {g.keeper && <> · vs <span className="kp">{g.keeper}</span></>}
            </div>
            <div className="grun">
              {g.after && (
                <>
                  <span className="h">{g.after.home}</span>
                  <span className="s">-</span>
                  <span className="a">{g.after.away}</span>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
