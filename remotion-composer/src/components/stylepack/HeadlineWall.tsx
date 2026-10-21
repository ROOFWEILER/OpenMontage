import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { StyleTokens, envelope, onColor, tokens } from "./shared";

/**
 * HeadlineWall — news-style headline cards slam onto a wall one after another
 * while the camera slowly pulls back; one card (`highlightIndex`) carries the
 * accent. For news-hook reels. Every headline must be a real, sourced
 * headline (cite it in the script); the cards are code-drawn, never a
 * publication's logo.
 */
export interface Headline { source: string; text: string }
export interface HeadlineWallProps extends StyleTokens {
  headlines: Headline[];
  highlightIndex?: number;
}

const SLOTS = [[0.06, 0.08, -4], [0.5, 0.14, 3], [0.1, 0.33, 2], [0.48, 0.4, -3], [0.05, 0.58, -2], [0.46, 0.65, 4]] as const;

export const HeadlineWall: React.FC<HeadlineWallProps> = ({ headlines, highlightIndex, ...style }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const t = tokens(style);
  const { visible } = envelope(frame, fps, durationInFrames, { outFrames: 10 });
  const pull = interpolate(frame, [0, durationInFrames], [1.12, 0.96]);
  return (
    <AbsoluteFill style={{ opacity: visible, transform: `scale(${pull})`, background: "rgba(10,11,14,0.55)" }}>
      {headlines.slice(0, SLOTS.length).map((h, i) => {
        const [x, y, rot] = SLOTS[i];
        const slam = spring({ frame: frame - 4 - i * 7, fps, config: { damping: 12, stiffness: 200, mass: 0.7 } });
        const hi = i === highlightIndex;
        return (
          <div key={i} style={{ position: "absolute", left: width * x, top: height * y, width: width * 0.48, padding: "26px 28px", boxSizing: "border-box", background: hi ? t.accent : "#F4F1EA", color: hi ? onColor(t.accent) : "#111", borderRadius: 8, boxShadow: "0 18px 40px rgba(0,0,0,0.45)", transform: `rotate(${rot}deg) scale(${interpolate(slam, [0, 1], [1.6, 1])})`, opacity: Math.min(1, slam * 2), fontFamily: "Georgia, 'Times New Roman', serif" }}>
            <div style={{ fontFamily: t.font, fontSize: 22, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", opacity: 0.7, marginBottom: 10 }}>{h.source}</div>
            <div style={{ fontSize: 38, fontWeight: 700, lineHeight: 1.12 }}>{h.text}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
