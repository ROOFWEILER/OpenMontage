import { interpolate, spring } from "remotion";
import { loadArchivo, loadSpaceGrotesk } from "../../lib/localFonts";

/**
 * Style-pack shared bits: brand tokens every effect accepts, and the
 * enter/exit envelope they all use so one reel's effects move alike.
 * Everything is code-drawn and frame-driven (no randomness, no network),
 * so a render is deterministic and costs nothing per reel.
 */

export interface StyleTokens {
  accentColor?: string; // brand accent (ticks, highlighted bar, glow)
  surfaceColor?: string; // card / panel fill
  textColor?: string; // text on the surface
  mutedColor?: string; // secondary text, inactive bars
  fontFamily?: string; // heading/body family (must be loaded by the comp)
}

export const DEFAULT_FONT = loadSpaceGrotesk(["500", "700"]).fontFamily;

/** Bundled families a style card may name in `fontFamily` (no network at render). */
export const BUNDLED_FONTS: Record<string, string> = {
  "Space Grotesk": DEFAULT_FONT,
  Archivo: loadArchivo(["500", "700", "800"]).fontFamily,
};

export const tokens = (t: StyleTokens) => ({
  accent: t.accentColor ?? "#22D3EE",
  surface: t.surfaceColor ?? "rgba(15, 23, 42, 0.82)",
  text: t.textColor ?? "#F8FAFC",
  muted: t.mutedColor ?? "#94A3B8",
  font: t.fontFamily ?? `${DEFAULT_FONT}, Inter, system-ui, sans-serif`,
});

/** 0→1 spring in, 1→0 linear out over the last `outFrames`. */
export const envelope = (
  frame: number,
  fps: number,
  durationInFrames: number,
  { delay = 0, outFrames = 10, damping = 16, stiffness = 120 } = {}
) => {
  const enter = spring({ frame: frame - delay, fps, config: { damping, stiffness, mass: 0.9 } });
  const exit = interpolate(frame, [durationInFrames - outFrames, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { enter, exit, visible: Math.min(enter, exit) };
};

/** Deterministic idle float: a slow sine on frame, phase-shifted per item. */
export const float = (frame: number, fps: number, amp = 10, periodSec = 4, phase = 0) =>
  Math.sin(((frame / fps) * 2 * Math.PI) / periodSec + phase) * amp;

/** Black or white, whichever reads on the accent (yellow/amber → black, ink/red → white). */
export const onColor = (hex: string) => {
  const m = /^#?([0-9a-f]{6})/i.exec(hex);
  if (!m) return "#000";
  const n = parseInt(m[1], 16);
  const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.4 ? "#000" : "#FFF";
};
