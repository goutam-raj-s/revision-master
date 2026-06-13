"use client";

import * as React from "react";

export type CharacterId =
  | "aria"
  | "kai"
  | "mira"
  | "leo"
  | "zoe"
  | "noah"
  | "emi"
  | "raj"
  | "luna"
  | "finn"
  | "sora"
  | "miso";

type HairStyle =
  | "bun"
  | "short"
  | "long"
  | "curly"
  | "ponytail"
  | "buzz"
  | "wavy"
  | "manbun"
  | "braids"
  | "beanie"
  | "pixie";

interface CharacterPreset {
  name: string;
  skin: string;
  hair: string;
  shirt: string;
  hairStyle: HairStyle;
  cat?: boolean;
  fur?: string;
}

export const CHARACTERS: Record<CharacterId, CharacterPreset> = {
  aria: { name: "Aria", skin: "#e8b89a", hair: "#3a2a22", shirt: "#0d9488", hairStyle: "bun" },
  kai: { name: "Kai", skin: "#c98a5e", hair: "#15151a", shirt: "#2563eb", hairStyle: "short" },
  mira: { name: "Mira", skin: "#f1c9a5", hair: "#6b4423", shirt: "#9333ea", hairStyle: "long" },
  leo: { name: "Leo", skin: "#a8703f", hair: "#241608", shirt: "#059669", hairStyle: "curly" },
  zoe: { name: "Zoe", skin: "#f3cdab", hair: "#d8a44b", shirt: "#ec4899", hairStyle: "ponytail" },
  noah: { name: "Noah", skin: "#7a4a28", hair: "#15151a", shirt: "#1e3a8a", hairStyle: "buzz" },
  emi: { name: "Emi", skin: "#e0a878", hair: "#8a3b2a", shirt: "#f97316", hairStyle: "wavy" },
  raj: { name: "Raj", skin: "#b97a48", hair: "#1a1410", shirt: "#4d7c0f", hairStyle: "manbun" },
  luna: { name: "Luna", skin: "#6b4226", hair: "#1a1212", shirt: "#7c3aed", hairStyle: "braids" },
  finn: { name: "Finn", skin: "#efc4a0", hair: "#475569", shirt: "#d97706", hairStyle: "beanie" },
  sora: { name: "Sora", skin: "#f1c9a5", hair: "#14b8a6", shirt: "#334155", hairStyle: "pixie" },
  miso: { name: "Miso", skin: "", hair: "", shirt: "", hairStyle: "short", cat: true, fur: "#d9a05b" },
};

export const STORAGE_KEY = "lostbae-completion-character";

export function getStoredCharacter(): CharacterId {
  if (typeof window === "undefined") return "aria";
  const v = window.localStorage.getItem(STORAGE_KEY) as CharacterId | null;
  return v && v in CHARACTERS ? v : "aria";
}

export function setStoredCharacter(id: CharacterId) {
  window.localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent("lostbae-character-change", { detail: id }));
}

function Hair({ style, color }: { style: HairStyle; color: string }) {
  switch (style) {
    case "bun":
      return (
        <>
          <circle cx="120" cy="86" r="7" fill={color} />
          <path d="M104 104 Q104 86 120 86 Q136 86 136 104 Z" fill={color} />
        </>
      );
    case "short":
      return <path d="M104 104 Q104 84 120 84 Q136 84 136 104 Q128 96 120 96 Q112 96 104 104 Z" fill={color} />;
    case "long":
      return (
        <>
          <path d="M103 106 Q103 84 120 84 Q137 84 137 106 Q130 96 120 96 Q110 96 103 106 Z" fill={color} />
          <path d="M103 104 Q100 120 104 132 L110 130 Q107 116 108 104 Z" fill={color} />
          <path d="M137 104 Q140 120 136 132 L130 130 Q133 116 132 104 Z" fill={color} />
        </>
      );
    case "curly":
      return (
        <>
          <circle cx="108" cy="92" r="7" fill={color} />
          <circle cx="120" cy="86" r="8" fill={color} />
          <circle cx="132" cy="92" r="7" fill={color} />
          <circle cx="104" cy="100" r="5" fill={color} />
          <circle cx="136" cy="100" r="5" fill={color} />
        </>
      );
    case "ponytail":
      return (
        <>
          <path d="M104 104 Q104 84 120 84 Q136 84 136 104 Q128 96 120 96 Q112 96 104 104 Z" fill={color} />
          {/* tail sweeping right */}
          <path d="M134 96 Q150 100 148 120 Q146 130 139 131 L137 121 Q143 110 132 102 Z" fill={color} />
          <circle cx="135" cy="96" r="3.5" fill={color} />
        </>
      );
    case "buzz":
      return <path d="M107 102 Q107 88 120 88 Q133 88 133 102 Q126 97 120 97 Q114 97 107 102 Z" fill={color} opacity="0.92" />;
    case "wavy":
      return (
        <path
          d="M104 104 Q104 84 120 84 Q136 84 136 104 Q132 98 128 102 Q124 98 120 102 Q116 98 112 102 Q108 98 104 104 Z"
          fill={color}
        />
      );
    case "manbun":
      return (
        <>
          <ellipse cx="120" cy="83" rx="5.5" ry="4.5" fill={color} />
          <path d="M105 104 Q105 90 120 90 Q135 90 135 104 Q128 98 120 98 Q112 98 105 104 Z" fill={color} />
        </>
      );
    case "braids":
      return (
        <>
          <path d="M104 104 Q104 84 120 84 Q136 84 136 104 Q128 96 120 96 Q112 96 104 104 Z" fill={color} />
          {/* left braid */}
          <circle cx="105" cy="110" r="4" fill={color} />
          <circle cx="104" cy="118" r="3.6" fill={color} />
          <circle cx="104" cy="125" r="3.2" fill={color} />
          {/* right braid */}
          <circle cx="135" cy="110" r="4" fill={color} />
          <circle cx="136" cy="118" r="3.6" fill={color} />
          <circle cx="136" cy="125" r="3.2" fill={color} />
        </>
      );
    case "beanie":
      return (
        <>
          <path d="M106 100 Q106 81 120 81 Q134 81 134 100 Z" fill={color} />
          <rect x="103" y="97" width="34" height="6.5" rx="3" fill={color} />
          <circle cx="120" cy="80" r="2.6" fill={color} />
        </>
      );
    case "pixie":
      return (
        <path
          d="M104 104 Q104 84 120 84 Q139 84 137 103 Q134 92 123 92 Q118 96 112 95 Q108 98 104 104 Z"
          fill={color}
        />
      );
  }
}

/** Cozy animated "study desk" completion scene with a selectable companion. */
export function CompletionScene({
  characterId,
  className,
}: {
  characterId: CharacterId;
  className?: string;
}) {
  const c = CHARACTERS[characterId] ?? CHARACTERS.aria;

  return (
    <svg viewBox="0 0 260 200" className={className} role="img" aria-label={`${c.name} at a study desk, all caught up`}>
      <defs>
        <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lightCone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* floor shadow */}
      <ellipse cx="130" cy="184" rx="92" ry="8" fill="#1e2d24" opacity="0.06" />

      {/* lamp light cone */}
      <polygon points="196,70 226,70 244,150 178,150" fill="url(#lightCone)" className="scene-glow" />
      {/* lamp glow halo */}
      <circle cx="211" cy="74" r="26" fill="url(#lampGlow)" className="scene-glow" />

      {/* desk */}
      <rect x="40" y="150" width="180" height="10" rx="3" fill="#c79a6b" />
      <rect x="40" y="160" width="180" height="4" rx="2" fill="#a87d52" />
      <rect x="52" y="164" width="6" height="20" rx="2" fill="#a87d52" />
      <rect x="202" y="164" width="6" height="20" rx="2" fill="#a87d52" />

      {/* desk lamp (right) */}
      <g fill="#3a4a40">
        <rect x="196" y="142" width="30" height="6" rx="3" />
        <rect x="208" y="108" width="5" height="36" rx="2" transform="rotate(8 210 126)" />
        <rect x="206" y="100" width="5" height="20" rx="2" transform="rotate(-38 208 110)" />
      </g>
      <path d="M196 92 q14 -12 28 0 l-6 12 q-8 -7 -16 0 Z" fill="#3a4a40" />
      <circle cx="211" cy="100" r="4" fill="#fde68a" className="scene-glow" />

      {/* books stack (left) */}
      <rect x="56" y="138" width="40" height="6" rx="1.5" fill="#3b82f6" />
      <rect x="60" y="132" width="40" height="6" rx="1.5" fill="#9333ea" />
      <rect x="58" y="126" width="40" height="6" rx="1.5" fill="#059669" />

      {/* mug + steam */}
      <g>
        <rect x="150" y="134" width="16" height="14" rx="3" fill="#e4efe7" stroke="#9db8aa" strokeWidth="1.5" />
        <path d="M166 137 q6 1 6 5 q0 4 -6 5" fill="none" stroke="#9db8aa" strokeWidth="1.5" />
        <path d="M156 130 q-3 -4 0 -8" stroke="#cdebe0" strokeWidth="2" fill="none" strokeLinecap="round" className="scene-steam" />
        <path d="M161 130 q3 -4 0 -8" stroke="#cdebe0" strokeWidth="2" fill="none" strokeLinecap="round" className="scene-steam" style={{ animationDelay: "0.7s" }} />
      </g>

      {/* character */}
      <g className="scene-bob">
        {c.cat ? (
          // Sleeping cat curled on a book
          <g>
            <ellipse cx="120" cy="140" rx="30" ry="16" fill={c.fur} />
            <ellipse cx="120" cy="138" rx="22" ry="11" fill="#e9c188" />
            <path d="M96 134 l-5 -8 l9 3 Z" fill={c.fur} />
            <path d="M108 130 l-2 -9 l7 6 Z" fill={c.fur} />
            <circle cx="98" cy="140" r="7" fill={c.fur} />
            <path d="M94 139 q1 2 4 0" stroke="#5a3a1a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M150 140 q6 -2 4 -10" stroke={c.fur ?? "#d9a05b"} strokeWidth="6" fill="none" strokeLinecap="round" className="scene-tail" />
            <text x="138" y="120" fontSize="11" fill="#9db8aa" className="scene-z">z</text>
            <text x="146" y="112" fontSize="14" fill="#9db8aa" className="scene-z" style={{ animationDelay: "1s" }}>Z</text>
          </g>
        ) : (
          <g>
            {/* torso */}
            <path d="M100 150 Q100 122 120 122 Q140 122 140 150 Z" fill={c.shirt} />
            {/* arms resting on desk */}
            <rect x="96" y="138" width="18" height="9" rx="4" fill={c.shirt} transform="rotate(8 105 142)" />
            <rect x="126" y="138" width="18" height="9" rx="4" fill={c.shirt} transform="rotate(-8 135 142)" />
            <circle cx="100" cy="146" r="4.5" fill={c.skin} />
            <circle cx="140" cy="146" r="4.5" fill={c.skin} />
            {/* open book in front */}
            <path d="M104 150 l16 -4 l16 4 l-16 5 Z" fill="#f1f5f2" stroke="#cdd9d0" strokeWidth="1" />
            <path d="M120 146 v9" stroke="#cdd9d0" strokeWidth="1" />
            {/* neck + head */}
            <rect x="116" y="114" width="8" height="8" fill={c.skin} />
            <circle cx="120" cy="104" r="13" fill={c.skin} />
            <Hair style={c.hairStyle} color={c.hair} />
            {/* face — content, eyes closed in a calm smile */}
            <path d="M114 104 q2 2 4 0" stroke="#3a2a22" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d="M122 104 q2 2 4 0" stroke="#3a2a22" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d="M116 110 q4 3 8 0" stroke="#b06a52" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </g>
        )}
      </g>

      {/* sparkles */}
      <g fill="none" stroke="#10b981" strokeWidth="1.6" strokeLinecap="round" className="scene-twinkle">
        <path d="M70 96 v6 M67 99 h6" />
      </g>
      <g fill="none" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round" className="scene-twinkle" style={{ animationDelay: "1.1s" }}>
        <path d="M176 50 v5 M173.5 52.5 h5" />
      </g>
    </svg>
  );
}
