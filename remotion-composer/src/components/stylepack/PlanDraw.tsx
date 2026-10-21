import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { StyleTokens, envelope, tokens } from "./shared";

/**
 * PlanDraw — a floor plan draws itself on paper: walls trace room by room,
 * then labels and an optional dimension appear. Rooms are 0-1 rectangles in
 * the plan box. It is a diagram, not a real permit drawing: no stamps, no
 * license numbers, no "our project" framing.
 */
export interface PlanRoom { x: number; y: number; w: number; h: number; label?: string }
export interface PlanDrawProps extends StyleTokens {
  rooms?: PlanRoom[];
  title?: string;
  dimension?: string; // e.g. "14' x 12'"
  highlightRoom?: number;
  position?: "lower" | "center" | "upper";
}

const DEFAULT_ROOMS: PlanRoom[] = [
  { x: 0, y: 0, w: 0.55, h: 0.45, label: "Kitchen" },
  { x: 0.55, y: 0, w: 0.45, h: 0.45, label: "Dining" },
  { x: 0, y: 0.45, w: 0.4, h: 0.55, label: "Bath" },
  { x: 0.4, y: 0.45, w: 0.6, h: 0.55, label: "Living" },
];

export const PlanDraw: React.FC<PlanDrawProps> = ({ rooms = DEFAULT_ROOMS, title, dimension, highlightRoom, position = "center", ...style }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const t = tokens({ surfaceColor: "#FAFAF7", textColor: "#0B0B0C", mutedColor: "#737373", ...style });
  const { enter, visible } = envelope(frame, fps, durationInFrames, { damping: 16 });
  const W = width * 0.86, H = W * 0.95, pad = 50;
  const pw = W - pad * 2, ph = H - pad * 2 - (title ? 60 : 0);
  const top = position === "upper" ? height * 0.08 : position === "lower" ? height * 0.42 : (height - H) / 2 - height * 0.05;
  const per = Math.max(8, Math.round(fps * 0.45)); // frames per room
  return (
    <AbsoluteFill style={{ opacity: visible }}>
      <div style={{ position: "absolute", left: (width - W) / 2, top: top + interpolate(enter, [0, 1], [50, 0]), width: W, height: H, borderRadius: 20, background: t.surface, boxShadow: "0 30px 70px rgba(0,0,0,0.35)", padding: pad, boxSizing: "border-box", fontFamily: t.font }}>
        {title ? <div style={{ color: t.text, fontSize: 42, fontWeight: 700, height: 60 }}>{title}</div> : null}
        <svg width={pw} height={ph} style={{ overflow: "visible" }}>
          <defs>
            <pattern id="pd-grid" width={pw / 20} height={pw / 20} patternUnits="userSpaceOnUse">
              <path d={`M ${pw / 20} 0 L 0 0 0 ${pw / 20}`} fill="none" stroke="#E7E5DF" strokeWidth={1} />
            </pattern>
          </defs>
          <rect width={pw} height={ph} fill="url(#pd-grid)" />
          {rooms.map((r, i) => {
            const draw = interpolate(frame, [6 + i * per, 6 + (i + 1) * per], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const x = r.x * pw, y = r.y * ph, w = r.w * pw, h = r.h * ph;
            const perim = 2 * (w + h);
            const labelOn = interpolate(frame, [6 + (i + 1) * per, 12 + (i + 1) * per], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const hi = i === highlightRoom;
            return (
              <g key={i}>
                {hi ? <rect x={x} y={y} width={w} height={h} fill={t.accent} opacity={0.12 * labelOn} /> : null}
                <rect x={x} y={y} width={w} height={h} fill="none" stroke={hi ? t.accent : t.text} strokeWidth={hi ? 8 : 6} strokeDasharray={perim} strokeDashoffset={perim * (1 - draw)} strokeLinejoin="round" />
                {r.label ? <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="middle" fontSize={34} fontWeight={600} fill={hi ? t.accent : t.text} opacity={labelOn}>{r.label}</text> : null}
              </g>
            );
          })}
          {dimension ? (
            <g opacity={interpolate(frame, [6 + rooms.length * per + 6, 6 + rooms.length * per + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
              <line x1={0} y1={ph + 30} x2={pw} y2={ph + 30} stroke={t.muted} strokeWidth={3} />
              <line x1={0} y1={ph + 18} x2={0} y2={ph + 42} stroke={t.muted} strokeWidth={3} />
              <line x1={pw} y1={ph + 18} x2={pw} y2={ph + 42} stroke={t.muted} strokeWidth={3} />
              <text x={pw / 2} y={ph + 24} textAnchor="middle" fontSize={30} fill={t.muted} style={{ paintOrder: "stroke" }} stroke={t.surface} strokeWidth={10}>{dimension}</text>
            </g>
          ) : null}
        </svg>
      </div>
    </AbsoluteFill>
  );
};
