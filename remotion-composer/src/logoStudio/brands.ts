import { loadArchivo, loadBebasNeue, loadInter, loadRoboto } from "../lib/localFonts";

/**
 * Logo studio brand kits. One entry per brand; LogoIntro + LogoEndCard read only this.
 *
 * Logos are the brands' REAL files, copied byte-for-byte into public/logo-studio/ and only
 * trimmed of fully transparent margin (pixels untouched). Never redraw a mark here.
 *   roofweiler-*            ~/.claude/brands/roofweiler/assets/logos/rw-{icon,wordmark}-yellow.png
 *   proofwright-lockup      proofwright.ai header logo (HTML/CSS on the site, no image file): rendered from
 *                           its exact computed styles by ProofWrightLockup.tsx. The italic-serif "PW" PNG
 *                           (pw-mark.png / pw-logo.png) is the OLD mark — never use it (David 2026-10-21).
 *   tepui-construction-*    tepuiconstruction.com public/tepui-logo-review.png (red mesa + CONSTRUCTION)
 *   tepui-management-*      tepuimanagement.com public/logos/wordmark.png (red mesa + MANAGEMENT)
 *   turnkey-crews-*         ~/.claude/brands/turnkey-crews/assets/logos/tkc-wordmark-white.png
 *
 * Lines are each brand's own locked Signal / slogan (vault brands/<slug>/<slug>.md, brand
 * visual-tokens.json). Brand rules baked in: Roofweiler no prices and no face; Tepui
 * Construction no license claim and never "our work"; sentence case + no "!" for Tepui.
 */

export type Intensity = "calm" | "bold" | "clean" | "industrial";

export interface LogoAsset {
  src: string; // public/ path
  w: number; // trimmed pixel size
  h: number;
}

export interface LogoStudioBrand {
  name: string;
  intensity: Intensity;
  /** The hero mark, extruded in 3D. */
  logo: LogoAsset;
  /** Optional second lockup that wipes in under the hero (Roofweiler: dog icon + wordmark). */
  wordmark?: LogoAsset;
  /** Max on-screen width of the hero logo, in 1080-px units (keeps small source files sharp). */
  maxLogoWidth: number;
  background: string;
  /** Colour of the soft radial light behind the logo. */
  glow: string;
  accent: string;
  text: string;
  muted: string;
  /** Extrusion side shade (CSS brightness) — lower = darker sides. */
  sideBrightness: number;
  display: { family: string; weight: number; uppercase: boolean; tracking: string };
  body: { family: string; weight: number };
  /** The brand line on the end card ("\n" = line break). */
  line: string;
  /** CTA pill text (optional; without it the pill carries the URL). */
  cta?: string;
  ctaBg: string;
  ctaText: string;
  url: string;
  /** Ground effect under the logo. */
  floor: "reflection" | "grid" | "shadow" | "stripe";
}

const archivo = loadArchivo(["500", "800", "900"]).fontFamily;
const inter = loadInter(["500", "600", "800"]).fontFamily;
const roboto = loadRoboto(["500", "900"]).fontFamily;
const bebas = loadBebasNeue().fontFamily;

export const LOGO_STUDIO_BRANDS: Record<string, LogoStudioBrand> = {
  roofweiler: {
    name: "Roofweiler",
    intensity: "calm",
    logo: { src: "logo-studio/roofweiler-icon.png", w: 401, h: 656 },
    wordmark: { src: "logo-studio/roofweiler-wordmark.png", w: 1192, h: 123 },
    maxLogoWidth: 300,
    background: "#000000",
    glow: "rgba(255,194,0,0.16)",
    accent: "#FFC200",
    text: "#FFFFFF",
    muted: "#BDBDBD",
    sideBrightness: 0.42,
    display: { family: roboto, weight: 900, uppercase: true, tracking: "0.01em" },
    body: { family: roboto, weight: 500 },
    line: "No salesman.\nNo surprises.",
    cta: "Price your roof in 30 seconds",
    ctaBg: "#FFC200",
    ctaText: "#000000",
    url: "roofweiler.com/price-my-roof",
    floor: "reflection",
  },
  proofwright: {
    name: "ProofWright",
    intensity: "bold",
    logo: { src: "logo-studio/proofwright-lockup.png", w: 1447, h: 312 },
    maxLogoWidth: 860,
    // Live proofwright.ai: ground #0A0B0E, text #F2F3F5, amber #FFB000 (tile, "Wright", buttons).
    background: "#0A0B0E",
    glow: "rgba(255,176,0,0.18)",
    accent: "#FFB000",
    text: "#F2F3F5",
    muted: "#8A8F9C",
    sideBrightness: 0.38,
    display: { family: archivo, weight: 900, uppercase: false, tracking: "-0.01em" },
    body: { family: archivo, weight: 500 },
    line: "Built by an operator.\nProven in production.",
    // No cta: the pill carries the URL. "Comment BUILD…" was baked in here until 2026-10-24 —
    // an end card never carries a comment/DM ask (see END_CARD_ASK_RE below).
    ctaBg: "#FFB000",
    ctaText: "#0A0B0E",
    url: "proofwright.ai",
    floor: "grid",
  },
  "tepui-construction": {
    name: "Tepui Construction",
    intensity: "clean",
    logo: { src: "logo-studio/tepui-construction-lockup.png", w: 818, h: 411 },
    maxLogoWidth: 720,
    background: "#FAFAF7",
    glow: "rgba(220,38,38,0.07)",
    accent: "#DC2626",
    text: "#0B0B0C",
    muted: "#6B6B6B",
    sideBrightness: 0.55,
    display: { family: archivo, weight: 900, uppercase: false, tracking: "-0.01em" },
    body: { family: inter, weight: 500 },
    line: "We stay. We finish.\nWe come back.",
    // Red is reserved for the single CTA moment.
    cta: "Paid when you see progress.",
    ctaBg: "#DC2626",
    ctaText: "#FFFFFF",
    url: "tepuiconstruction.com",
    floor: "shadow",
  },
  "tepui-management": {
    name: "Tepui Management",
    intensity: "clean",
    logo: { src: "logo-studio/tepui-management-lockup.png", w: 818, h: 430 },
    maxLogoWidth: 720,
    background: "#FAFAF7",
    glow: "rgba(239,41,41,0.07)",
    accent: "#EF2929",
    text: "#0B0B0C",
    muted: "#6B6B6B",
    sideBrightness: 0.55,
    display: { family: archivo, weight: 900, uppercase: false, tracking: "-0.01em" },
    body: { family: inter, weight: 500 },
    line: "Your home, handled.",
    // Red discipline (one red element per screen = the logo): the pill is ink.
    cta: "One company. Our name on it.",
    ctaBg: "#0B0B0C",
    ctaText: "#FAFAF7",
    url: "tepuimanagement.com",
    floor: "shadow",
  },
  "turnkey-crews": {
    name: "Turnkey Crews",
    intensity: "industrial",
    logo: { src: "logo-studio/turnkey-crews-lockup.png", w: 682, h: 458 },
    maxLogoWidth: 640,
    background: "#121212",
    glow: "rgba(236,172,9,0.14)",
    accent: "#ECAC09",
    text: "#FFFFFF",
    muted: "#A3A3A3",
    sideBrightness: 0.4,
    display: { family: bebas, weight: 400, uppercase: true, tracking: "0.02em" },
    body: { family: inter, weight: 600 },
    line: "Our crew. Your brand.\nYour day back.",
    ctaBg: "#ECAC09",
    ctaText: "#121212",
    url: "turnkeycrews.com",
    floor: "stripe",
  },
};

/**
 * ⛔ An end card NEVER carries a comment/DM ask (David 2026-10-24). The card is appended to every
 * reel, so an ask baked in here would dodge the content line's ask gate (no asks before
 * 2026-11-02, then ~1 in 10 posts, each with its own DM giveaway): the ask lives in the
 * caption/script only. Same words the gate looks for (~/.claude/skills/content-planner/lib/asks.mjs).
 * A brand kit that breaks this throws, so the render fails instead of shipping the ask.
 */
export const END_CARD_ASK_RE = /\b(comment|comenta|comentar|coment[aá]rio|dm|dms|message us|send us a message|reply|responde|escr[ií]benos|mensaje|link in bio|tell us below|drop a)\b/i;
for (const [key, b] of Object.entries(LOGO_STUDIO_BRANDS)) {
  for (const text of [b.line, b.cta ?? ""]) {
    if (END_CARD_ASK_RE.test(text)) throw new Error(`logo studio: the ${key} end card carries an ask ("${text}"); asks belong in the caption/script, never on the card`);
  }
}

export const LOGO_STUDIO_BRAND_KEYS = Object.keys(LOGO_STUDIO_BRANDS);

export type LogoStudioAspect = "9x16" | "1x1" | "16x9";
export const ASPECT_SIZES: Record<LogoStudioAspect, { width: number; height: number }> = {
  "9x16": { width: 1080, height: 1920 },
  "1x1": { width: 1080, height: 1080 },
  "16x9": { width: 1920, height: 1080 },
};

export const LOGO_STUDIO_FPS = 30;
export const INTRO_FRAMES = 36; // 1.2 s — short: the reel's hook owns the first second
export const ENDCARD_FRAMES = 75; // 2.5 s — under Argus' 3.0 s endcard ceiling (MSR-15)
