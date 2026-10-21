import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveAsset } from "../../lib/resolveAsset";
import { StyleTokens, envelope, tokens } from "./shared";

/**
 * LocationPin — a pin drops onto a map card, ripples, and the place name
 * slides in ("Doral, FL"). With `mapSrc` (a real map screenshot) the pin lands
 * on it; without, a code-drawn street grid stands in. Names a place, never an
 * address.
 */
export interface LocationPinProps extends StyleTokens {
  place: string;
  sublabel?: string;
  mapSrc?: string;
  pinAt?: [number, number]; // 0-1 inside the map card
  position?: "lower" | "center" | "upper";
}

const STREETS = [0.12, 0.27, 0.41, 0.58, 0.73, 0.88];

export const LocationPin: React.FC<LocationPinProps> = ({ place, sublabel, mapSrc, pinAt = [0.5, 0.48], position = "center", ...style }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const t = tokens(style);
  const { enter, visible } = envelope(frame, fps, durationInFrames, { damping: 15 });
  const w = width * 0.86;
  const h = w * 0.8;
  const top = position === "upper" ? height * 0.08 : position === "lower" ? height * 0.44 : (height - h) / 2 - height * 0.06;
  const drop = spring({ frame: frame - 8, fps, config: { damping: 9, stiffness: 160, mass: 0.7 } });
  const ripple = (k: number) => interpolate((frame - 18 - k * 9) % 40, [0, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const label = spring({ frame: frame - 16, fps, config: { damping: 16 } });
  const px = pinAt[0] * w, py = pinAt[1] * h;
  return (
    <AbsoluteFill style={{ opacity: visible }}>
      <div style={{ position: "absolute", left: (width - w) / 2, top: top + interpolate(enter, [0, 1], [60, 0]), width: w, height: h, borderRadius: 32, overflow: "hidden", background: "#1b1d22", boxShadow: "0 30px 70px rgba(0,0,0,0.5)" }}>
        {mapSrc ? (
          <Img src={resolveAsset(mapSrc)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
            {STREETS.map((f, i) => (
              <g key={i} stroke="#3a3e47" strokeWidth={i % 2 ? 6 : 12}>
                <line x1={0} y1={f * h} x2={w} y2={f * h + (i - 3) * 14} />
                <line x1={f * w} y1={0} x2={f * w + (i - 3) * 10} y2={h} />
              </g>
            ))}
            <path d={`M ${w * 0.78} 0 C ${w * 0.7} ${h * 0.4}, ${w * 0.95} ${h * 0.6}, ${w * 0.86} ${h}`} stroke="#2f5d7c" strokeWidth={60} fill="none" opacity={0.7} />
          </svg>
        )}
        {[0, 1, 2].map((k) => (
          <div key={k} style={{ position: "absolute", left: px - 80, top: py - 22, width: 160, height: 44, borderRadius: "50%", border: `4px solid ${t.accent}`, transform: `scale(${0.3 + ripple(k) * 1.6})`, opacity: frame > 18 ? 1 - ripple(k) : 0 }} />
        ))}
        <svg width={90} height={120} viewBox="0 0 90 120" style={{ position: "absolute", left: px - 45, top: py - 118 - (1 - drop) * h * 0.6, filter: "drop-shadow(0 10px 12px rgba(0,0,0,0.5))" }}>
          <path d="M45 118 C 20 80, 4 62, 4 42 A 41 41 0 0 1 86 42 C 86 62, 70 80, 45 118 Z" fill={t.accent} />
          <circle cx={45} cy={42} r={16} fill="#111" />
        </svg>
      </div>
      <div style={{ position: "absolute", left: (width - w) / 2 + 30, top: top + h - 60, padding: "22px 34px", borderRadius: 24, background: t.surface, fontFamily: t.font, opacity: label, transform: `translateY(${interpolate(label, [0, 1], [40, 0])}px)`, boxShadow: "0 16px 40px rgba(0,0,0,0.45)" }}>
        <div style={{ color: t.text, fontSize: 60, fontWeight: 800, lineHeight: 1 }}>{place}</div>
        {sublabel ? <div style={{ color: t.muted, fontSize: 32, fontWeight: 500, marginTop: 8 }}>{sublabel}</div> : null}
      </div>
    </AbsoluteFill>
  );
};
