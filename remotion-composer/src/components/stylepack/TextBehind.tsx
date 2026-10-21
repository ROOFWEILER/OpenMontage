import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { StyleTokens, envelope, tokens } from "./shared";

/**
 * TextBehind — a huge title that sits between the background and the
 * presenter: TalkingHead draws it on the background video and then redraws
 * the presenter on top from `foregroundMatteSrc` (an alpha video made with
 * tools/enhancement/bg_remove.py in video mode). Without a matte it simply
 * sits above the head, so place it high (`top`).
 *
 * Words drop in one by one with a slight overshoot, then hold.
 */
export interface TextBehindProps extends StyleTokens {
  text: string;
  subtitle?: string;
  top?: number; // 0-1 of height, the title's top edge
  fontSize?: number;
}

export const TextBehind: React.FC<TextBehindProps> = ({ text, subtitle, top = 0.1, fontSize, ...style }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const t = tokens(style);
  const { visible } = envelope(frame, fps, durationInFrames, { outFrames: 8 });
  const words = text.split(/\s+/).filter(Boolean);
  const longest = Math.max(...words.map((w) => w.length));
  // Archivo/Space Grotesk caps run ~0.72 em wide; keep the longest word inside 92% of the frame.
  const size = fontSize ?? Math.min(300, Math.floor((width * 0.92) / Math.max(3, longest * 0.74)));

  return (
    <AbsoluteFill style={{ opacity: visible }}>
      <div
        style={{
          position: "absolute",
          top: height * top,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: t.font,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 0.88,
          letterSpacing: -size * 0.03,
          textTransform: "uppercase",
          color: t.text,
          textShadow: `0 10px 50px rgba(0,0,0,0.35)`,
        }}
      >
        {words.map((w, i) => {
          const drop = spring({ frame: frame - i * 5, fps, config: { damping: 10, stiffness: 140, mass: 0.8 } });
          return (
            <div
              key={i}
              style={{
                color: i === words.length - 1 ? t.accent : t.text,
                transform: `translateY(${interpolate(drop, [0, 1], [-size * 0.6, 0])}px) scale(${interpolate(drop, [0, 1], [1.25, 1])})`,
                opacity: Math.min(1, drop * 1.5),
              }}
            >
              {w}
            </div>
          );
        })}
        {subtitle ? (
          <div style={{ fontSize: 46, fontWeight: 500, letterSpacing: 4, color: t.text, marginTop: 24, opacity: interpolate(frame, [words.length * 5 + 6, words.length * 5 + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
            {subtitle}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
