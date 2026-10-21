import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveAsset } from "../../lib/resolveAsset";
import { StyleTokens, envelope, onColor, tokens } from "./shared";

/**
 * BeforeAfter — two real photos of the same roof/room in one card; a divider
 * sweeps across and wipes "before" into "after", then settles at `restAt`.
 * Use real job photos only (never generated "after" images).
 */
export interface BeforeAfterProps extends StyleTokens {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  restAt?: number; // where the divider settles after the full wipe, 0-1 (0.5 = side by side)
  position?: "lower" | "center" | "upper";
}

export const BeforeAfter: React.FC<BeforeAfterProps> = ({ beforeSrc, afterSrc, beforeLabel = "Before", afterLabel = "After", restAt = 0.5, position = "center", ...style }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const t = tokens(style);
  const { enter, visible } = envelope(frame, fps, durationInFrames, { damping: 15 });
  const cardW = width * 0.88;
  const cardH = cardW * 1.05;
  const top = position === "upper" ? height * 0.08 : position === "lower" ? height * 0.42 : (height - cardH) / 2 - height * 0.05;
  // divider: starts all "before", wipes almost fully to "after", then settles at restAt
  const split = interpolate(frame, [fps * 0.5, fps * 1.6, fps * 2.4], [1, 0.06, restAt], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const chip = (text: string, side: "left" | "right", on: number) => (
    <div style={{ position: "absolute", top: 24, [side]: 24, padding: "10px 22px", borderRadius: 999, background: side === "right" ? t.accent : "rgba(0,0,0,0.65)", color: side === "right" ? onColor(t.accent) : "#fff", fontFamily: t.font, fontWeight: 700, fontSize: 34, textTransform: "uppercase", letterSpacing: 2, opacity: on }}>
      {text}
    </div>
  );
  return (
    <AbsoluteFill style={{ opacity: visible }}>
      <div style={{ position: "absolute", left: (width - cardW) / 2, top: top + interpolate(enter, [0, 1], [60, 0]), width: cardW, height: cardH, borderRadius: 32, overflow: "hidden", boxShadow: "0 30px 70px rgba(0,0,0,0.5)", border: `3px solid ${t.accent}` }}>
        <Img src={resolveAsset(afterSrc)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - split) * 100}% 0 0)` }}>
          <Img src={resolveAsset(beforeSrc)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: `${split * 100}%`, width: 6, marginLeft: -3, background: t.accent }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", width: 70, height: 70, margin: "-35px 0 0 -35px", borderRadius: "50%", background: t.accent, boxShadow: "0 6px 20px rgba(0,0,0,0.4)" }} />
        </div>
        {chip(beforeLabel, "left", interpolate(split, [0.15, 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))}
        {chip(afterLabel, "right", interpolate(split, [0.65, 0.85], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }))}
      </div>
    </AbsoluteFill>
  );
};
