import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { StyleTokens, envelope, tokens } from "./shared";

/**
 * ChartGrow — bars rise from the baseline one after another, values count up,
 * and the highlighted bar (default: the last) takes the brand accent while
 * the rest stay muted. An optional headline (e.g. "2x faster") counts up
 * above the chart. Use only numbers the script sources: the chart draws the
 * data it is given and nothing else.
 */
export interface ChartGrowProps extends StyleTokens {
  data: { label: string; value: number }[];
  title?: string;
  headline?: string; // e.g. "3 hrs → 20 min"
  valuePrefix?: string; // e.g. "$"
  valueSuffix?: string; // e.g. "%", " hrs"
  highlightIndex?: number;
  barSeconds?: number[]; // when each bar starts growing (s from the overlay start), to hit the VO
  position?: "lower" | "center" | "upper";
}

export const ChartGrow: React.FC<ChartGrowProps> = ({
  data,
  title,
  headline,
  valuePrefix = "",
  valueSuffix = "",
  highlightIndex,
  barSeconds,
  position = "lower",
  ...style
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const t = tokens(style);
  const panel = envelope(frame, fps, durationInFrames, { damping: 15 });
  const max = Math.max(1, ...data.map((d) => d.value));
  const hi = highlightIndex ?? data.length - 1;
  const chartH = height * 0.2;
  const top = position === "upper" ? height * 0.08 : position === "center" ? height * 0.28 : height * 0.47;
  const decimals = data.some((d) => !Number.isInteger(d.value)) ? 1 : 0;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: width * 0.07,
          right: width * 0.07,
          top,
          padding: "40px 46px 34px",
          borderRadius: 36,
          background: t.surface,
          backdropFilter: "blur(18px)",
          border: `2px solid ${t.accent}55`,
          boxShadow: "0 30px 70px rgba(0,0,0,0.45)",
          fontFamily: t.font,
          opacity: panel.visible,
          transform: `translateY(${interpolate(panel.enter, [0, 1], [80, 0])}px)`,
        }}
      >
        {title ? <div style={{ color: t.muted, fontSize: 36, fontWeight: 500, marginBottom: 6 }}>{title}</div> : null}
        {headline ? (
          <div style={{ color: t.text, fontSize: 76, fontWeight: 700, lineHeight: 1.05, marginBottom: 24, transform: `scale(${spring({ frame: frame - 8, fps, config: { damping: 12 } })})`, transformOrigin: "left center" }}>
            {headline}
          </div>
        ) : null}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 26, height: chartH, borderBottom: `3px solid ${t.muted}66` }}>
          {data.map((d, i) => {
            const start = barSeconds?.[i] != null ? Math.round(barSeconds[i] * fps) : 10 + i * 7;
            const grow = spring({ frame: frame - start, fps, config: { damping: 15, stiffness: 70 } });
            const h = (d.value / max) * chartH * grow;
            const isHi = i === hi;
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                <div style={{ color: isHi ? t.accent : t.text, fontSize: 38, fontWeight: 700, marginBottom: 10, opacity: grow }}>
                  {valuePrefix}
                  {(d.value * grow).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
                  {valueSuffix}
                </div>
                <div
                  style={{
                    width: "100%",
                    height: h,
                    borderRadius: "16px 16px 4px 4px",
                    background: isHi ? `linear-gradient(180deg, ${t.accent}, ${t.accent}AA)` : `${t.muted}77`,
                    boxShadow: isHi ? `0 0 40px ${t.accent}66` : "none",
                  }}
                />
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 26, marginTop: 14 }}>
          {data.map((d, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", color: i === hi ? t.text : t.muted, fontSize: 30, fontWeight: 500 }}>
              {d.label}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
