import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { StyleTokens, envelope, onColor, tokens } from "./shared";

/**
 * Checklist — a glass panel whose items tick off one by one: the box pops,
 * the tick draws itself, the line settles. Items land evenly across the beat
 * unless `itemSeconds` gives each one its time (seconds from the beat start),
 * so ticks can hit the words of the VO.
 */
export interface ChecklistProps extends StyleTokens {
  items: string[];
  title?: string;
  itemSeconds?: number[];
  position?: "lower" | "center" | "upper";
}

export const Checklist: React.FC<ChecklistProps> = ({ items, title, itemSeconds, position = "lower", ...style }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const t = tokens(style);
  const panel = envelope(frame, fps, durationInFrames, { damping: 15 });
  const span = Math.max(1, durationInFrames - fps * 0.8);
  const at = (i: number) =>
    itemSeconds?.[i] != null ? Math.round(itemSeconds[i] * fps) : Math.round(fps * 0.35 + (i * span) / Math.max(1, items.length));

  const top = position === "upper" ? height * 0.1 : position === "center" ? height * 0.3 : height * 0.5;
  const rowH = 118;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: width * 0.07,
          right: width * 0.07,
          top,
          padding: "40px 46px",
          borderRadius: 36,
          background: t.surface,
          backdropFilter: "blur(18px)",
          border: `2px solid ${t.accent}55`,
          boxShadow: "0 30px 70px rgba(0,0,0,0.45)",
          fontFamily: t.font,
          opacity: panel.visible,
          transform: `translateY(${interpolate(panel.enter, [0, 1], [80, 0])}px) scale(${interpolate(panel.enter, [0, 1], [0.94, 1])})`,
        }}
      >
        {title ? <div style={{ color: t.accent, fontSize: 40, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 18 }}>{title}</div> : null}
        {items.map((item, i) => {
          const f = frame - at(i);
          const pop = spring({ frame: f, fps, config: { damping: 11, stiffness: 160 } });
          const draw = interpolate(f, [4, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const slide = spring({ frame: f + 3, fps, config: { damping: 18 } });
          const done = draw >= 1;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", height: rowH, gap: 30 }}>
              <div
                style={{
                  flex: "0 0 auto",
                  width: 76,
                  height: 76,
                  borderRadius: 20,
                  border: `5px solid ${f >= 0 ? t.accent : t.muted}`,
                  background: f >= 0 ? t.accent : "transparent",
                  transform: `scale(${f >= 0 ? 0.6 + pop * 0.4 : 1})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="52" height="52" viewBox="0 0 52 52">
                  <path
                    d="M10 27 L22 38 L43 14"
                    fill="none"
                    stroke={onColor(t.accent)}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="60"
                    strokeDashoffset={60 * (1 - draw)}
                  />
                </svg>
              </div>
              <div
                style={{
                  color: done ? t.text : t.muted,
                  fontSize: 50,
                  fontWeight: done ? 700 : 500,
                  lineHeight: 1.1,
                  opacity: interpolate(slide, [0, 1], [0.45, 1]),
                  transform: `translateX(${interpolate(slide, [0, 1], [24, 0])}px)`,
                }}
              >
                {item}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
