import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveAsset } from "../../lib/resolveAsset";
import { StyleTokens, envelope, float, onColor, tokens } from "./shared";

/**
 * PhoneMockup — a real app screen inside an iPhone that rises in from the
 * bottom, settles with a slight 3D tilt and floats while the presenter talks.
 *
 * Pass `mockupSrc` (a transparent framed iPhone PNG from the App Media
 * Library's Current/iPhone Mockups) to use it as-is, or `screenSrc` (an
 * unframed Current/Original Screenshots PNG) to get a code-drawn frame.
 * Never a redrawn or generated screen: the pixels are the real app.
 *
 * `scrollFraction` pans a tall screenshot upward over the beat (0 = none).
 * `tapAt` [x, y] (0-1 of the screen) shows a finger-tap pulse at `tapAtSeconds`.
 */
export interface PhoneMockupProps extends StyleTokens {
  screenSrc?: string;
  mockupSrc?: string;
  side?: "left" | "right" | "center";
  label?: string;
  scrollFraction?: number;
  tapAt?: [number, number];
  tapAtSeconds?: number;
  phoneWidth?: number; // px on the 1080-wide canvas
}

const ASPECT = 2.165; // iPhone 15/16 screen height / width

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  screenSrc,
  mockupSrc,
  side = "right",
  label,
  scrollFraction = 0,
  tapAt,
  tapAtSeconds = 1.2,
  phoneWidth,
  ...style
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const t = tokens(style);
  const { enter, visible } = envelope(frame, fps, durationInFrames, { damping: 14, stiffness: 90 });

  const w = phoneWidth ?? (side === "center" ? width * 0.62 : width * 0.4);
  const h = w * ASPECT;
  const bezel = w * 0.045;
  // Side phones sit beside the presenter's shoulder, below the face line, above the captions.
  const restX = side === "left" ? width * 0.03 : side === "right" ? width - w - width * 0.03 : (width - w) / 2;
  const restY = side === "center" ? (height - h) / 2 - height * 0.04 : height * 0.3;

  const rise = interpolate(enter, [0, 1], [height * 0.55, 0]);
  const tilt = interpolate(enter, [0, 1], [side === "left" ? 28 : -28, side === "left" ? 9 : side === "right" ? -9 : 0]);
  const y = restY + rise + float(frame, fps, 9, 3.6);
  const scroll = interpolate(frame, [fps * 0.6, durationInFrames - 8], [0, scrollFraction], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tapFrame = Math.round(tapAtSeconds * fps);
  const tapP = interpolate(frame, [tapFrame, tapFrame + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const screen = screenSrc ? (
    <div style={{ position: "absolute", inset: mockupSrc ? 0 : bezel, borderRadius: w * 0.11, overflow: "hidden", background: "#000" }}>
      <Img
        src={resolveAsset(screenSrc)}
        style={{ width: "100%", display: "block", transform: `translateY(${-scroll * 100}%)` }}
      />
      {tapAt && tapP > 0 && tapP < 1 ? (
        <div
          style={{
            position: "absolute",
            left: `${tapAt[0] * 100}%`,
            top: `${tapAt[1] * 100}%`,
            width: w * 0.16,
            height: w * 0.16,
            marginLeft: -w * 0.08,
            marginTop: -w * 0.08,
            borderRadius: "50%",
            border: `${w * 0.012}px solid ${t.accent}`,
            background: `${t.accent}33`,
            transform: `scale(${0.4 + tapP * 0.9})`,
            opacity: 1 - tapP,
          }}
        />
      ) : null}
    </div>
  ) : null;

  return (
    <AbsoluteFill style={{ perspective: 1800, opacity: visible }}>
      {/* soft accent glow under the phone */}
      <div
        style={{
          position: "absolute",
          left: restX - w * 0.15,
          top: restY + h * 0.15,
          width: w * 1.3,
          height: h * 0.8,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${t.accent}55, transparent)`,
          filter: "blur(40px)",
          opacity: enter,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: restX,
          top: y,
          width: w,
          height: h,
          transform: `rotateY(${tilt}deg) rotateX(4deg)`,
          transformStyle: "preserve-3d",
          filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.55))",
        }}
      >
        {mockupSrc ? (
          <>
            {screen}
            <Img src={resolveAsset(mockupSrc)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} />
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, borderRadius: w * 0.15, background: "linear-gradient(145deg,#2b2f36,#0b0c0f)", boxShadow: "inset 0 0 0 3px #4a4f58" }}>
            {screen}
            {/* dynamic island */}
            <div style={{ position: "absolute", top: bezel + w * 0.035, left: "50%", width: w * 0.3, height: w * 0.085, marginLeft: -w * 0.15, borderRadius: w, background: "#000" }} />
          </div>
        )}
      </div>
      {label ? (
        <div
          style={{
            position: "absolute",
            left: restX + w * 0.5,
            top: restY - 110 + float(frame, fps, 6, 3.6, 1),
            translate: "-50% 0",
            padding: "18px 28px",
            borderRadius: 999,
            background: t.accent,
            color: onColor(t.accent),
            fontFamily: t.font,
            fontWeight: 700,
            fontSize: 40,
            transform: `scale(${envelope(frame, fps, durationInFrames, { delay: 10 }).enter})`,
            boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
