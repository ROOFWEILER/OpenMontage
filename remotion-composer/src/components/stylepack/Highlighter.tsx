import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { StyleTokens, envelope, tokens } from "./shared";

/**
 * Highlighter — a document card (contract, permit checklist, invoice terms)
 * whose key lines get a marker swept across them one after another, so the
 * viewer reads exactly the clause the VO is talking about. Text is the
 * script's own words — never a real customer's document.
 */
export interface HighlighterProps extends StyleTokens {
  lines: string[];
  highlights: number[]; // line indexes to mark, in order
  title?: string;
  highlightSeconds?: number[]; // when each mark sweeps (s from the overlay start)
  markerColor?: string;
  position?: "lower" | "center" | "upper";
}

export const Highlighter: React.FC<HighlighterProps> = ({ lines, highlights, title, highlightSeconds, markerColor, position = "center", ...style }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const t = tokens({ surfaceColor: "#FFFFFF", textColor: "#1A1A1A", mutedColor: "#9A9A9A", ...style });
  const marker = markerColor ?? `${t.accent}55`;
  const { enter, visible } = envelope(frame, fps, durationInFrames, { damping: 16 });
  const W = width * 0.86;
  const top = position === "upper" ? height * 0.08 : position === "lower" ? height * 0.44 : height * 0.2;
  const at = (k: number) => (highlightSeconds?.[k] != null ? highlightSeconds[k] * fps : fps * 0.6 + k * fps * 0.9);
  return (
    <AbsoluteFill style={{ opacity: visible }}>
      <div style={{ position: "absolute", left: (width - W) / 2, top: top + interpolate(enter, [0, 1], [50, 0]), width: W, padding: "48px 52px", boxSizing: "border-box", borderRadius: 18, background: t.surface, boxShadow: "0 30px 70px rgba(0,0,0,0.35)", fontFamily: t.font, transform: `rotate(${interpolate(enter, [0, 1], [-3, -1])}deg)` }}>
        {title ? <div style={{ color: t.text, fontSize: 44, fontWeight: 800, marginBottom: 26, paddingBottom: 18, borderBottom: `3px solid ${t.text}` }}>{title}</div> : null}
        {lines.map((line, i) => {
          const k = highlights.indexOf(i);
          const sweep = k < 0 ? 0 : interpolate(frame, [at(k), at(k) + fps * 0.45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ position: "relative", fontSize: 36, lineHeight: 1.35, padding: "8px 0", color: k < 0 ? t.muted : t.text, fontWeight: k < 0 ? 400 : 600 }}>
              <div style={{ position: "absolute", left: -10, top: 10, bottom: 8, width: `calc(${sweep * 100}% + ${sweep * 20}px)`, opacity: sweep > 0 ? 1 : 0, background: marker, borderRadius: 6, transform: "skewX(-8deg)" }} />
              <span style={{ position: "relative" }}>{line}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
