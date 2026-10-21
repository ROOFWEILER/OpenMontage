import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { StyleTokens, envelope, onColor, tokens } from "./shared";
import { Sfx } from "./sfx";

/**
 * StepTracker — a vertical process (permit → demo → rough-in → finish): a
 * progress line fills down, each node lights as its step is reached, the
 * current step is bold and the rest wait. Steps land evenly unless
 * `stepSeconds` times them to the VO.
 */
export interface StepTrackerProps extends StyleTokens {
  steps: string[];
  title?: string;
  stepSeconds?: number[];
  position?: "lower" | "center" | "upper";
}

export const StepTracker: React.FC<StepTrackerProps> = ({ steps, title, stepSeconds, position = "center", ...style }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const t = tokens(style);
  const { enter, visible } = envelope(frame, fps, durationInFrames, { damping: 15 });
  const n = Math.max(1, steps.length);
  const span = Math.max(1, durationInFrames - fps * 0.8);
  const at = (i: number) => (stepSeconds?.[i] != null ? stepSeconds[i] * fps : fps * 0.3 + (i * span) / n);
  const row = 128;
  const top = position === "upper" ? height * 0.08 : position === "lower" ? height * 0.42 : (height - n * row - 140) / 2;
  const reached = steps.filter((_, i) => frame >= at(i)).length;
  const fill = reached <= 1 ? 0 : interpolate(frame, [at(reached - 1), at(reached - 1) + 10], [(reached - 2) / (n - 1), (reached - 1) / (n - 1)], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: visible }}>
      <div style={{ position: "absolute", left: width * 0.07, right: width * 0.07, top: top + interpolate(enter, [0, 1], [60, 0]), padding: "40px 46px", borderRadius: 36, background: t.surface, border: `2px solid ${t.accent}44`, boxShadow: "0 30px 70px rgba(0,0,0,0.4)", fontFamily: t.font }}>
        {title ? <div style={{ color: t.accent, fontSize: 38, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>{title}</div> : null}
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 30, top: row / 2, width: 8, height: (n - 1) * row, marginLeft: -4, borderRadius: 4, background: `${t.muted}55` }} />
          <div style={{ position: "absolute", left: 30, top: row / 2, width: 8, height: (n - 1) * row * fill, marginLeft: -4, borderRadius: 4, background: t.accent }} />
          {steps.map((s, i) => {
            const on = frame >= at(i);
            const pop = spring({ frame: frame - at(i), fps, config: { damping: 11, stiffness: 180 } });
            const current = i === reached - 1;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", height: row, gap: 34 }}>
                <div style={{ position: "relative", width: 60, height: 60, borderRadius: "50%", flex: "0 0 auto", background: on ? t.accent : t.surface, border: `6px solid ${on ? t.accent : t.muted}`, transform: `scale(${on ? 0.7 + pop * 0.3 : 0.85})`, color: onColor(t.accent), fontWeight: 800, fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
                  {on ? i + 1 : ""}
                </div>
                <div style={{ color: current ? t.text : on ? t.text : t.muted, fontSize: current ? 54 : 44, fontWeight: current ? 800 : 500, opacity: on ? 1 : 0.6 }}>{s}</div>
              </div>
            );
          })}
        </div>
      </div>
      {steps.map((_, i) => <Sfx key={i} kind="tick" frame={at(i)} />)}
    </AbsoluteFill>
  );
};
