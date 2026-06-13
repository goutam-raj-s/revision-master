import * as React from "react";

export type StatArtKind = "documents" | "due" | "completed" | "active";

/** Small animated mascots that live in each dashboard stat card. */
export function StatArt({ kind, className }: { kind: StatArtKind; className?: string }) {
  switch (kind) {
    case "documents":
      return <BookMascot className={className} />;
    case "due":
      return <ClockMascot className={className} />;
    case "completed":
      return <TrophyMascot className={className} />;
    case "active":
      return <RocketMascot className={className} />;
  }
}

function face(cx: number, cy: number) {
  return (
    <>
      <circle cx={cx - 4} cy={cy} r="1.4" fill="#1e2d24" />
      <circle cx={cx + 4} cy={cy} r="1.4" fill="#1e2d24" />
      <path d={`M${cx - 4} ${cy + 4} Q${cx} ${cy + 7} ${cx + 4} ${cy + 4}`} stroke="#1e2d24" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </>
  );
}

/** Total Documents — a happy open book. */
function BookMascot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g className="stat-bob">
        {/* pages */}
        <path d="M32 20 Q22 16 13 19 L13 46 Q22 43 32 47 Z" fill="#dbe9fb" stroke="#93c0f5" strokeWidth="1.4" />
        <path d="M32 20 Q42 16 51 19 L51 46 Q42 43 32 47 Z" fill="#eef5fe" stroke="#93c0f5" strokeWidth="1.4" />
        <path d="M32 20 L32 47" stroke="#93c0f5" strokeWidth="1.4" />
        {/* lines */}
        <path d="M18 26 H28 M18 31 H28 M18 36 H26" stroke="#bcd6f7" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M36 26 H46 M36 31 H46 M36 36 H44" stroke="#bcd6f7" strokeWidth="1.3" strokeLinecap="round" />
        {/* face on the spine area */}
        {face(32, 30)}
        {/* bobbing bookmark */}
        <path d="M44 18 L44 28 L47 25 L50 28 L50 18 Z" fill="#3b82f6" className="stat-tag" />
      </g>
    </svg>
  );
}

/** Due Today — an alarm clock with wiggling bells. */
function ClockMascot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {/* bells */}
      <g className="stat-wiggle" style={{ transformOrigin: "32px 18px" }}>
        <circle cx="22" cy="16" r="5" fill="#34d399" />
        <circle cx="42" cy="16" r="5" fill="#34d399" />
      </g>
      <g className="stat-bob">
        <circle cx="32" cy="36" r="18" fill="#d1fae5" stroke="#10b981" strokeWidth="1.6" />
        <circle cx="32" cy="36" r="13" fill="#ecfdf5" />
        {/* hands */}
        <line x1="32" y1="36" x2="32" y2="27" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" className="stat-tick" style={{ transformOrigin: "32px 36px" }} />
        <line x1="32" y1="36" x2="39" y2="36" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" />
        {/* legs */}
        <line x1="22" y1="52" x2="19" y2="57" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
        <line x1="42" y1="52" x2="45" y2="57" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
        {face(32, 40)}
      </g>
    </svg>
  );
}

/** Completed — a trophy with a shine. */
function TrophyMascot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g className="stat-bob">
        {/* handles */}
        <path d="M20 22 Q12 22 12 30 Q12 36 20 35" fill="none" stroke="#94a3b8" strokeWidth="2.2" />
        <path d="M44 22 Q52 22 52 30 Q52 36 44 35" fill="none" stroke="#94a3b8" strokeWidth="2.2" />
        {/* cup */}
        <path d="M20 18 H44 V26 Q44 40 32 42 Q20 40 20 26 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.6" />
        {/* stem + base */}
        <rect x="30" y="42" width="4" height="6" fill="#94a3b8" />
        <rect x="24" y="48" width="16" height="4" rx="1.5" fill="#94a3b8" />
        {face(32, 27)}
        {/* shine */}
        <path d="M26 21 L24 27" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.8" className="stat-shine" />
      </g>
      {/* sparkles */}
      <g className="stat-twinkle" stroke="#64748b" strokeWidth="1.3" strokeLinecap="round">
        <path d="M50 14 v4 M48 16 h4" />
      </g>
    </svg>
  );
}

/** Active — an energetic rocket. */
function RocketMascot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g className="stat-bob">
        {/* flame */}
        <path d="M28 46 Q32 58 36 46 Q34 50 32 50 Q30 50 28 46 Z" fill="#f59e0b" className="stat-flicker" style={{ transformOrigin: "32px 48px" }} />
        {/* body */}
        <path d="M32 10 Q44 22 40 44 L24 44 Q20 22 32 10 Z" fill="#fde9c8" stroke="#d97706" strokeWidth="1.6" />
        {/* fins */}
        <path d="M24 38 L17 48 L24 45 Z" fill="#d97706" />
        <path d="M40 38 L47 48 L40 45 Z" fill="#d97706" />
        {/* window */}
        <circle cx="32" cy="26" r="6" fill="#ffe9c2" stroke="#d97706" strokeWidth="1.4" />
        {face(32, 25)}
      </g>
    </svg>
  );
}
