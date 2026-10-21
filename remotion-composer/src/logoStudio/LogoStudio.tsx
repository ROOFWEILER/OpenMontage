import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { LOGO_STUDIO_BRANDS, LogoAsset, LogoStudioBrand, Intensity } from "./brands";

/**
 * Logo studio — a code-drawn 3D logo intro and end card for every brand.
 *
 * The 3D is CSS 3D inside Remotion (perspective + preserve-3d): the brand's REAL logo PNG is the
 * front face, and a stack of darkened copies behind it is the extrusion. Deterministic, no GPU,
 * no network, no per-render cost. The front face is the untouched logo file, so the mark can
 * never drift from the source.
 *
 * Props: brand (key of LOGO_STUDIO_BRANDS), transparent (no background: alpha renders).
 * Size comes from the composition (9x16 / 1x1 / 16x9), everything scales off min(width, height).
 */

export type LogoStudioProps = {
  brand: string;
  transparent?: boolean;
};

const getBrand = (key: string): LogoStudioBrand => {
  const b = LOGO_STUDIO_BRANDS[key];
  if (!b) throw new Error(`Logo studio: unknown brand "${key}" (known: ${Object.keys(LOGO_STUDIO_BRANDS).join(", ")})`);
  return b;
};

/** Per-intensity motion: how far the mark turns, how deep it is, whether it overshoots. */
const MOTION: Record<Intensity, { fromRotY: number; fromRotX: number; fromZ: number; depth: number; damping: number; stiffness: number }> = {
  calm: { fromRotY: -38, fromRotX: 8, fromZ: -500, depth: 26, damping: 200, stiffness: 60 },
  // Never turn past ~80deg: beyond edge-on the back of the stack shows a MIRRORED mark.
  bold: { fromRotY: -80, fromRotX: 18, fromZ: -1400, depth: 34, damping: 13, stiffness: 110 },
  clean: { fromRotY: 0, fromRotX: 24, fromZ: -260, depth: 14, damping: 200, stiffness: 80 },
  industrial: { fromRotY: 70, fromRotX: -6, fromZ: -700, depth: 30, damping: 18, stiffness: 120 },
};

const fitLogo = (asset: LogoAsset, maxW: number, maxH: number) => {
  const s = Math.min(maxW / asset.w, maxH / asset.h);
  return { w: asset.w * s, h: asset.h * s };
};

/** The extruded logo: darkened copies stacked back in Z, the real file on the front, a masked sheen. */
const Logo3D: React.FC<{
  asset: LogoAsset;
  w: number;
  h: number;
  depth: number;
  sideBrightness: number;
  sheen: number; // 0..1 sweep position; <0 = off
  glow?: string;
}> = ({ asset, w, h, depth, sideBrightness, sheen, glow }) => {
  const src = staticFile(asset.src);
  const step = 1.5;
  const layers = Math.max(1, Math.round(depth / step));
  const face: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: w, height: h };
  return (
    <div style={{ position: "relative", width: w, height: h, transformStyle: "preserve-3d" }}>
      {Array.from({ length: layers }, (_, i) => {
        const k = layers - i; // back to front
        const shade = sideBrightness * (0.7 + 0.3 * (1 - k / layers));
        return (
          <Img
            key={k}
            src={src}
            style={{ ...face, transform: `translateZ(${-k * step}px)`, filter: `brightness(${shade})` }}
          />
        );
      })}
      <Img src={src} style={{ ...face, transform: "translateZ(0.5px)", filter: glow ? `drop-shadow(0 0 ${w * 0.06}px ${glow})` : undefined }} />
      {sheen >= 0 && sheen <= 1 ? (
        <div
          style={{
            ...face,
            transform: "translateZ(1px)",
            WebkitMaskImage: `url(${src})`,
            WebkitMaskSize: "100% 100%",
            maskImage: `url(${src})`,
            maskSize: "100% 100%",
            background: `linear-gradient(105deg, rgba(255,255,255,0) ${sheen * 160 - 40}%, rgba(255,255,255,0.55) ${sheen * 160 - 25}%, rgba(255,255,255,0) ${sheen * 160 - 10}%)`,
            mixBlendMode: "screen",
          }}
        />
      ) : null}
    </div>
  );
};

/** Brand ground: soft light behind the mark + the brand's floor treatment. */
const Backdrop: React.FC<{ b: LogoStudioBrand; cx: number; cy: number; u: number; transparent: boolean; reveal: number; frame: number }> = ({ b, cx, cy, u, transparent, reveal, frame }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: transparent ? "transparent" : b.background, overflow: "hidden" }}>
      {!transparent ? (
        <div
          style={{
            position: "absolute",
            left: cx - 700 * u,
            top: cy - 700 * u,
            width: 1400 * u,
            height: 1400 * u,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${b.glow} 0%, rgba(0,0,0,0) 62%)`,
            opacity: reveal,
          }}
        />
      ) : null}
      {b.floor === "grid" && !transparent ? (
        <div style={{ position: "absolute", left: 0, top: cy + 120 * u, width, height: height - cy, perspective: 600 * u, perspectiveOrigin: "50% 0%", overflow: "hidden", opacity: 0.55 * reveal }}>
          <div
            style={{
              position: "absolute",
              left: -width,
              width: width * 3,
              top: 0,
              height: height * 1.6,
              transformOrigin: "50% 0%",
              transform: "rotateX(72deg)",
              backgroundImage: `linear-gradient(${b.accent}33 2px, transparent 2px), linear-gradient(90deg, ${b.accent}33 2px, transparent 2px)`,
              backgroundSize: `${90 * u}px ${90 * u}px`,
              backgroundPosition: `0 ${(frame * 3 * u) % (90 * u)}px`,
              WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 70%)",
              maskImage: "linear-gradient(to bottom, black 0%, transparent 70%)",
            }}
          />
        </div>
      ) : null}
      {b.floor === "stripe" ? (
        <div
          style={{
            position: "absolute",
            left: -width,
            top: cy - 70 * u,
            width: width * 3,
            height: 140 * u,
            background: `repeating-linear-gradient(-45deg, ${b.accent} 0 ${34 * u}px, ${b.accent}00 ${34 * u}px ${68 * u}px)`,
            opacity: 0.16,
            transform: `translateX(${interpolate(reveal, [0, 1], [-width, 0])}px) rotate(-8deg)`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

const groundShadow = (b: LogoStudioBrand, w: number, u: number, o: number): React.CSSProperties | null => {
  if (b.floor === "shadow") return { width: w * 0.9, height: 36 * u, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(11,11,12,0.22) 0%, rgba(11,11,12,0) 70%)", opacity: o };
  if (b.floor === "reflection") return { width: w * 1.6, height: 50 * u, borderRadius: "50%", background: `radial-gradient(ellipse, ${b.accent}40 0%, ${b.accent}00 70%)`, opacity: o };
  return null;
};

/** Shared entrance: 0 → 1 progress of the 3D landing, per intensity. */
const useLanding = (b: LogoStudioBrand, delay = 0, speed = 1) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = MOTION[b.intensity];
  const p = spring({ frame: frame - delay, fps: fps / speed, config: { damping: m.damping, stiffness: m.stiffness, mass: 1 } });
  const lin = interpolate(frame - delay, [0, 18 / speed], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return { p, lin, m };
};

// ---------------------------------------------------------------------------
// Intro (~1.2 s): the mark lands in 3D, a light sweeps it, done.
// ---------------------------------------------------------------------------
export const LogoIntro: React.FC<LogoStudioProps> = ({ brand, transparent = false }) => {
  const b = getBrand(brand);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const u = Math.min(width, height) / 1080;
  const { p, lin, m } = useLanding(b);

  const hasWordmark = Boolean(b.wordmark);
  const tall = height > width;
  const maxH = (hasWordmark ? 520 : 460) * u * (tall ? 1 : 0.8);
  const { w, h } = fitLogo(b.logo, b.maxLogoWidth * u * (tall ? 1 : 0.85), maxH);
  const cx = width / 2;
  const blockH = h + (hasWordmark ? 150 * u : 0);
  const cy = height * (tall ? 0.42 : 0.47);
  const top = cy - blockH / 2;

  const rotY = m.fromRotY * (1 - p);
  const rotX = m.fromRotX * (1 - p);
  const z = m.fromZ * (1 - p);
  const sheenStart = b.intensity === "bold" ? 14 : 16;
  const sheen = interpolate(frame, [sheenStart, sheenStart + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glowPulse = b.intensity === "bold" ? interpolate(frame, [10, 16, 30], [0, 1, 0.45], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;

  const wm = b.wordmark ? fitLogo(b.wordmark, 760 * u, 90 * u) : null;
  const wmReveal = interpolate(frame, [12, 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const shadow = groundShadow(b, w, u, lin);

  return (
    <AbsoluteFill>
      <Backdrop b={b} cx={cx} cy={cy} u={u} transparent={transparent} reveal={lin} frame={frame} />
      <div style={{ position: "absolute", left: 0, top, width, height: blockH, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ perspective: 1600 * u, width: w, height: h }}>
          <div style={{ width: w, height: h, transformStyle: "preserve-3d", transform: `translateZ(${z * u}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`, opacity: lin }}>
            <Logo3D asset={b.logo} w={w} h={h} depth={m.depth * u} sideBrightness={b.sideBrightness} sheen={sheen < 1 ? sheen : -1} glow={glowPulse > 0 ? `rgba(255,176,0,${0.5 * glowPulse})` : undefined} />
          </div>
        </div>
        {shadow ? <div style={{ ...shadow, marginTop: hasWordmark ? -10 * u : 10 * u }} /> : null}
        {wm ? (
          <div style={{ marginTop: 30 * u, width: wm.w, height: wm.h, clipPath: `inset(0 ${(1 - wmReveal) * 100}% 0 0)`, opacity: wmReveal }}>
            <Img src={staticFile(b.wordmark!.src)} style={{ width: wm.w, height: wm.h }} />
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// End card (~2.5 s): the mark settles, then line → CTA → URL, held to the end.
// ---------------------------------------------------------------------------
const rise = (frame: number, start: number, u: number) => {
  const t = interpolate(frame, [start, start + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return { opacity: t, transform: `translateY(${(1 - t) * 28 * u}px)` };
};

export const LogoEndCard: React.FC<LogoStudioProps> = ({ brand, transparent = false }) => {
  const b = getBrand(brand);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const u = Math.min(width, height) / 1080;
  const tall = height > width;
  const wide = width > height;
  const { p, lin, m } = useLanding(b, 0, b.intensity === "bold" ? 1.3 : 1.15);

  // Smaller mark than the intro: the words carry the end card.
  const scale = tall ? 0.9 : wide ? 0.62 : 0.6;
  const { w, h } = fitLogo(b.logo, b.maxLogoWidth * u * scale, (b.wordmark ? 300 : 340) * u * (tall ? 1 : 0.8));
  const wm = b.wordmark ? fitLogo(b.wordmark, 680 * u * (tall ? 1 : 0.85), 80 * u) : null;

  const settleY = m.fromRotY * 0.35 * (1 - p);
  const breathe = Math.sin(frame / 18) * (b.intensity === "calm" || b.intensity === "clean" ? 3 : 6) * lin;
  const rotX = m.fromRotX * 0.5 * (1 - p);
  const z = m.fromZ * 0.4 * (1 - p);
  const sheen = interpolate(frame, [20, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const lineSize = (b.intensity === "industrial" ? 98 : b.display.uppercase ? 76 : 78) * u * (tall ? 1 : 0.9);
  const ctaSize = (b.display.uppercase ? 42 : 44) * u * (tall ? 1 : 0.9);
  const urlSize = 40 * u * (tall ? 1 : 0.9);
  const pillText = b.cta ?? b.url;
  const shadow = groundShadow(b, w, u, lin);

  return (
    <AbsoluteFill>
      <Backdrop b={b} cx={width / 2} cy={height * (tall ? 0.3 : 0.32)} u={u} transparent={transparent} reveal={lin} frame={frame} />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          // 9:16: keep everything above the platform UI (bottom ~20%) and under the top bar.
          paddingTop: tall ? height * 0.1 : 0,
          paddingBottom: tall ? height * 0.24 : height * 0.04,
          paddingLeft: 90 * u,
          paddingRight: 90 * u,
          textAlign: "center",
        }}
      >
        <div style={{ perspective: 1600 * u, width: w, height: h }}>
          <div style={{ width: w, height: h, transformStyle: "preserve-3d", transform: `translateZ(${z * u}px) rotateX(${rotX}deg) rotateY(${settleY + breathe}deg)`, opacity: lin }}>
            <Logo3D asset={b.logo} w={w} h={h} depth={m.depth * u * 0.8} sideBrightness={b.sideBrightness} sheen={sheen < 1 ? sheen : -1} />
          </div>
        </div>
        {shadow ? <div style={{ ...shadow, marginTop: 6 * u }} /> : null}
        {wm ? (
          <div style={{ marginTop: 26 * u, ...rise(frame, 6, u) }}>
            <Img src={staticFile(b.wordmark!.src)} style={{ width: wm.w, height: wm.h, display: "block" }} />
          </div>
        ) : null}
        <div
          style={{
            marginTop: (wm ? 54 : 64) * u,
            fontFamily: b.display.family,
            fontWeight: b.display.weight,
            fontSize: lineSize,
            lineHeight: 1.08,
            whiteSpace: "pre-line",
            letterSpacing: b.display.tracking,
            textTransform: b.display.uppercase ? "uppercase" : "none",
            color: b.text,
            maxWidth: 900 * u * (wide ? 1.4 : 1),
            ...rise(frame, 12, u),
          }}
        >
          {b.line}
        </div>
        <div
          style={{
            marginTop: 40 * u,
            padding: `${20 * u}px ${38 * u}px`,
            borderRadius: 999,
            background: b.ctaBg,
            color: b.ctaText,
            fontFamily: b.body.family,
            fontWeight: b.display.uppercase ? 900 : 800,
            fontSize: ctaSize,
            letterSpacing: b.display.uppercase ? "0.03em" : "0",
            textTransform: b.display.uppercase && b.cta ? "uppercase" : "none",
            ...rise(frame, 20, u),
          }}
        >
          {pillText}
        </div>
        {b.cta ? (
          <div style={{ marginTop: 26 * u, fontFamily: b.body.family, fontWeight: b.body.weight, fontSize: urlSize, color: b.muted, letterSpacing: "0.01em", ...rise(frame, 28, u) }}>
            {b.url}
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
