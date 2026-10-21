import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadArchivo } from "./lib/localFonts";
import { LogoIntro, LogoEndCard } from "./logoStudio/LogoStudio";
import { Sfx } from "./components/stylepack/sfx";

/**
 * SureWright launch film (hand-built hero, David 2026-10-21).
 *
 * Every phone is a real App Media Library `Current/iPhone Mockups` PNG (public/surewright-launch/mock,
 * MD5-checked by ~/.claude/bin/app-media; provenance in hero/surewright-launch/storyboard.md).
 * Nothing on a screen is redrawn: the camera only moves, tilts and zooms the untouched image, and
 * the finger dot + rings are drawn on top of it.
 *
 * Timing comes from public/surewright-launch/timeline.json (hero/surewright-launch/build_timeline.py):
 * VO line starts and per-word caption times. Shot times below are in seconds of the film.
 * Colours/type: SureWright site tokens (ProofWright family): ink #0A0B0E, amber #FFB000, Archivo,
 * lockup "Sure" 500 + "Wright" 900 amber.
 */

const INK = "#0A0B0E";
const AMBER = "#FFB000";
const WHITE = "#F2F3F5";
const MIST = "#8A8F9C";
const archivo = loadArchivo(["500", "700", "800", "900"]).fontFamily;

// Mockup PNGs are 1390x2806; the screen sits 92 px in from every edge.
const MOCK_W = 1390;
const MOCK_H = 2806;
/** Original-screenshot pixel (1206x2622) -> fraction of the mockup image. */
const px = (x: number, y: number): [number, number] => [(92 + x) / MOCK_W, (92 + y) / MOCK_H];

type Word = { w: string; s: number; e: number };
type Line = { id: string; text: string; t0: number; t1: number; src: string; words: Word[] };
export type SureWrightLaunchProps = { timeline: { total: number; lines: Line[] } };

const ease = Easing.bezier(0.33, 0, 0.12, 1);

// ── Camera keyframes ───────────────────────────────────────────────────────
// x, y: where the focal point sits on the canvas (0-1). f: focal point on the phone (mockup fraction).
// w: phone width in px at 1080 scale (zoom). ry/rx/rz: degrees.
type Key = { t: number; x: number; y: number; w: number; f?: [number, number]; ry?: number; rx?: number; rz?: number };
type Tap = { t: number; at: [number, number] };

const lerpKeys = (keys: Key[], t: number) => {
  const k = keys;
  if (t <= k[0].t) return k[0];
  for (let i = 0; i < k.length - 1; i++) {
    const a = k[i], b = k[i + 1];
    if (t <= b.t) {
      const p = ease((t - a.t) / (b.t - a.t));
      const m = (u?: number, v?: number) => (u ?? 0) + ((v ?? 0) - (u ?? 0)) * p;
      const fa = a.f ?? [0.5, 0.5], fb = b.f ?? [0.5, 0.5];
      return { t, x: m(a.x, b.x), y: m(a.y, b.y), w: m(a.w, b.w), f: [m(fa[0], fb[0]), m(fa[1], fb[1])] as [number, number], ry: m(a.ry, b.ry), rx: m(a.rx, b.rx), rz: m(a.rz, b.rz) };
    }
  }
  return k[k.length - 1];
};

const Finger: React.FC<{ taps: Tap[]; t: number; imgW: number; imgH: number; fromT: number }> = ({ taps, t, imgW, imgH, fromT }) => {
  if (!taps.length) return null;
  // The dot glides in from below the first target, then between targets, arriving 0.1 s before each tap.
  const pts = [{ t: Math.max(fromT, taps[0].t - 0.6), at: [taps[0].at[0] + 0.12, taps[0].at[1] + 0.12] as [number, number] }, ...taps];
  let pos = pts[0].at;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const arrive = b.t - 0.1;
    if (t >= arrive) pos = b.at;
    else if (t > a.t) {
      const p = ease((t - a.t) / (arrive - a.t));
      pos = [a.at[0] + (b.at[0] - a.at[0]) * p, a.at[1] + (b.at[1] - a.at[1]) * p];
      break;
    } else break;
  }
  const appear = interpolate(t, [pts[0].t, pts[0].t + 0.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const d = imgW * 0.085;
  const press = taps.reduce((acc, tp) => Math.max(acc, interpolate(t, [tp.t - 0.08, tp.t, tp.t + 0.12], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })), 0);
  return (
    <>
      {taps.map((tp, i) => {
        const r = interpolate(t, [tp.t, tp.t + 0.45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        if (r <= 0 || r >= 1) return null;
        return (
          <div key={i} style={{ position: "absolute", left: tp.at[0] * imgW, top: tp.at[1] * imgH, width: d * (1 + r * 1.6), height: d * (1 + r * 1.6), marginLeft: -(d * (1 + r * 1.6)) / 2, marginTop: -(d * (1 + r * 1.6)) / 2, borderRadius: "50%", border: `${imgW * 0.008}px solid ${AMBER}`, opacity: 1 - r }} />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: pos[0] * imgW,
          top: pos[1] * imgH,
          width: d,
          height: d,
          marginLeft: -d / 2,
          marginTop: -d / 2,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.55)",
          border: `${imgW * 0.006}px solid rgba(255,255,255,0.95)`,
          boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
          transform: `scale(${1 - press * 0.22})`,
          opacity: appear,
        }}
      />
    </>
  );
};

/** One real app screen, moved by a camera. `ring` draws an amber highlight box (mockup fractions). */
const Phone: React.FC<{
  src: string;
  keys: Key[];
  taps?: Tap[];
  ring?: { t: number; box: [number, number, number, number] };
  t: number; // film seconds
  fadeIn?: number;
}> = ({ src, keys, taps = [], ring, t, fadeIn = 0.12 }) => {
  const { width, height } = useVideoConfig();
  const u = Math.min(width, height) / 1080;
  const k = lerpKeys(keys, t);
  const imgW = k.w * u;
  const imgH = imgW * (MOCK_H / MOCK_W);
  const f = k.f ?? [0.5, 0.5];
  const left = k.x * width - f[0] * imgW;
  const top = k.y * height - f[1] * imgH;
  const op = interpolate(t, [keys[0].t, keys[0].t + fadeIn], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rp = ring ? interpolate(t, [ring.t, ring.t + 0.35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 2200 * u, opacity: op }}>
      <div
        style={{
          position: "absolute",
          left,
          top,
          width: imgW,
          height: imgH,
          transformOrigin: `${f[0] * 100}% ${f[1] * 100}%`,
          transform: `rotateY(${k.ry ?? 0}deg) rotateX(${k.rx ?? 0}deg) rotateZ(${k.rz ?? 0}deg)`,
        }}
      >
        <Img src={staticFile(`surewright-launch/mock/${src}`)} style={{ width: imgW, height: imgH, display: "block", filter: `drop-shadow(0 ${40 * u}px ${60 * u}px rgba(0,0,0,0.55))` }} />
        {ring && rp > 0 ? (
          <div
            style={{
              position: "absolute",
              left: ring.box[0] * imgW,
              top: ring.box[1] * imgH,
              width: (ring.box[2] - ring.box[0]) * imgW,
              height: (ring.box[3] - ring.box[1]) * imgH,
              borderRadius: imgW * 0.03,
              border: `${imgW * 0.008}px solid ${AMBER}`,
              boxShadow: `0 0 ${imgW * 0.04}px rgba(255,176,0,0.55)`,
              opacity: rp,
              transform: `scale(${1.08 - rp * 0.08})`,
            }}
          />
        ) : null}
        <Finger taps={taps} t={t} imgW={imgW} imgH={imgH} fromT={keys[0].t} />
      </div>
    </div>
  );
};

// ── Type ───────────────────────────────────────────────────────────────────
const Lockup: React.FC<{ size: number; color?: string }> = ({ size, color = WHITE }) => (
  <span style={{ fontFamily: archivo, fontSize: size, letterSpacing: "-0.02em", lineHeight: 1, color, whiteSpace: "nowrap" }}>
    <span style={{ fontWeight: 500 }}>Sure</span>
    <span style={{ fontWeight: 900, color: AMBER }}>Wright</span>
  </span>
);

/** Words land one by one at their spoken time (spring up + unblur). `hot` words go amber. */
const Kinetic: React.FC<{ words: { w: string; s: number; hot?: boolean; br?: boolean }[]; t: number; size: number; align?: "center" | "left"; out?: number }> = ({ words, t, size, align = "center", out }) => {
  const { fps } = useVideoConfig();
  const outP = out ? interpolate(t, [out, out + 0.18], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return (
    <div style={{ fontFamily: archivo, fontWeight: 900, fontSize: size, lineHeight: 1.04, letterSpacing: "-0.02em", color: WHITE, textAlign: align, opacity: outP }}>
      {words.map((x, i) => {
        const p = spring({ frame: (t - x.s) * fps, fps, config: { damping: 13, stiffness: 170, mass: 0.7 } });
        return (
          <React.Fragment key={i}>
          {x.br ? <br /> : null}
          <span style={{ display: "inline-block", marginRight: size * 0.24, color: x.hot ? AMBER : WHITE, opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * size * 0.5}px) scale(${0.85 + p * 0.15})`, filter: `blur(${(1 - Math.min(1, p)) * 8}px)` }}>
            {x.w}
          </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** Section kicker (the site's .label: uppercase, amber rule on top). */
const Kicker: React.FC<{ text: string; t: number; from: number; to: number; u: number }> = ({ text, t, from, to, u }) => {
  const p = interpolate(t, [from, from + 0.3, to - 0.2, to], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bar = interpolate(t, [from, from + 0.45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return (
    <div style={{ opacity: p, transform: `translateY(${(1 - p) * 14 * u}px)`, display: "inline-block" }}>
      <div style={{ height: 6 * u, width: `${bar * 100}%`, background: AMBER, marginBottom: 16 * u }} />
      <div style={{ fontFamily: archivo, fontWeight: 800, fontSize: 40 * u, letterSpacing: "0.12em", textTransform: "uppercase", color: WHITE }}>{text}</div>
    </div>
  );
};

/** Burned-in captions: the spoken words, 1-4 at a time, current word amber. */
const Captions: React.FC<{ lines: Line[]; t: number; skip: string[] }> = ({ lines, t, skip }) => {
  const { width, height } = useVideoConfig();
  const u = Math.min(width, height) / 1080;
  const wide = width > height;
  const L = lines.find((l) => !skip.includes(l.id) && t >= l.t0 - 0.05 && t <= l.t1 + 0.25);
  if (!L) return null;
  // Chunk: break after punctuation or at 4 words.
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  L.words.forEach((w) => {
    cur.push(w);
    if (/[.,?!]$/.test(w.w) || cur.length === 4) { chunks.push(cur); cur = []; }
  });
  if (cur.length) chunks.push(cur);
  const chunk = chunks.find((c, i) => t < (chunks[i + 1]?.[0].s ?? Infinity)) ?? chunks[chunks.length - 1];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: wide ? height * 0.84 : height * 0.735, display: "flex", justifyContent: "center", padding: `0 ${60 * u}px` }}>
      <div style={{ background: "rgba(10,11,14,0.86)", borderRadius: 18 * u, padding: `${14 * u}px ${26 * u}px`, fontFamily: archivo, fontWeight: 800, fontSize: (wide ? 50 : 60) * u, lineHeight: 1.15, color: WHITE, textAlign: "center", boxShadow: "0 8px 30px rgba(0,0,0,0.35)" }}>
        {chunk.map((w, i) => (
          <span key={i} style={{ color: t >= w.s && t < (chunk[i + 1]?.s ?? w.e + 0.3) ? AMBER : WHITE }}>
            {w.w.replace(/[,]$/, "")}{i < chunk.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </div>
  );
};

const Backdrop: React.FC<{ t: number }> = ({ t }) => {
  const { width, height } = useVideoConfig();
  const u = Math.min(width, height) / 1080;
  const drift = (t * 14 * u) % (90 * u);
  return (
    <AbsoluteFill style={{ background: INK }}>
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)`,
          backgroundSize: `${90 * u}px ${90 * u}px`,
          backgroundPosition: `0 ${drift}px`,
          maskImage: "radial-gradient(ellipse at 50% 45%, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 45%, black 20%, transparent 75%)",
        }}
      />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${height > width ? 52 : 50}%, rgba(255,176,0,0.13), transparent 55%)` }} />
    </AbsoluteFill>
  );
};

// ── The film ───────────────────────────────────────────────────────────────
export const SureWrightLaunch: React.FC<SureWrightLaunchProps> = ({ timeline }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const u = Math.min(width, height) / 1080;
  const wide = width > height;
  const line = (id: string) => timeline.lines.find((l) => l.id === id)!;
  const wordAt = (id: string, i: number) => line(id).words[i].s;
  const F = (s: number) => Math.round(s * fps);
  const between = (a: number, b: number) => t >= a && t < b;

  // Layout: 9:16 stacks text over a centred phone; 16:9 puts text left, phone right.
  const PX = wide ? 0.7 : 0.5; // phone column centre
  const PY = wide ? 0.5 : 0.56;
  const PW = wide ? 400 : 640; // phone width at rest (1080 basis)
  const textBox: React.CSSProperties = wide
    ? { position: "absolute", left: 130 * u, top: height * 0.3, width: width * 0.46 }
    : { position: "absolute", left: 70 * u, right: 70 * u, top: height * 0.075 };

  // Shot boundaries (s)
  const S1 = 1.2, S2 = 4.45, S3 = 7.6, S4 = 11.5, S5 = 17.7, S6 = 21.3, S7 = 23.8, S8 = 27.85, S9 = 30.85;
  // Line 4 word cues: "Your stops." "The map." "The checklist." "The photos."
  const c4 = [wordAt("4", 7), wordAt("4", 9), wordAt("4", 11), wordAt("4", 13)];

  return (
    <AbsoluteFill style={{ background: INK }}>
      {t >= S1 && t < S9 ? <Backdrop t={t} /> : null}

      {/* 0 — ProofWright presents (logo studio intro, 1.2 s) */}
      <Sequence durationInFrames={F(S1)}>
        <LogoIntro brand="proofwright" />
      </Sequence>

      {/* 1 — Hook: words land as they are spoken; the Money screen rises under them */}
      {between(S1, S2) ? (
        <>
          <Phone
            src="sw-06-money.png"
            t={t}
            keys={[
              { t: 2.7, x: 0.5, y: 1.35, w: PW * 1.05, f: px(603, 700), rx: 30, rz: -6 },
              { t: 3.4, x: PX, y: wide ? 0.62 : 0.68, w: PW * 1.25, f: px(603, 700), rx: 12, rz: -3 },
              { t: S2, x: PX, y: wide ? 0.6 : 0.66, w: PW * 1.35, f: px(603, 700), rx: 8, rz: -2 },
            ]}
            ring={{ t: 3.55, box: [...px(400, 480), ...px(720, 800)] as [number, number, number, number] }}
          />
          <div style={wide ? { ...textBox, top: height * 0.22 } : { ...textBox, top: height * 0.13 }}>
            <Kinetic
              t={t}
              size={(wide ? 88 : 92) * u}
              align={wide ? "left" : "center"}
              words={[
                ...line("1").words.slice(0, 4).map((w) => ({ w: w.w, s: w.s })),
                ...line("1").words.slice(4).map((w, i, a) => ({ w: w.w, s: w.s, hot: i >= a.length - 2 })),
              ].map((w, i) => (i === 4 ? { ...w, br: true } : w))}
            />
          </div>
          <Sfx kind="whoosh" frame={F(2.7)} />
          <Sfx kind="tick" frame={F(3.55)} />
        </>
      ) : null}

      {/* 2 — SureWright, for small home-service businesses */}
      {between(S2, S3) ? (
        <>
          <Phone
            src="sw-02-today.png"
            t={t}
            keys={[
              { t: S2, x: wide ? 1.1 : 1.25, y: PY + 0.08, w: PW * 0.92, ry: -45, rz: 4 },
              { t: S2 + 0.7, x: PX, y: wide ? PY : PY + 0.1, w: PW * 0.92, ry: -16, rz: 2 },
              { t: S3, x: PX, y: wide ? PY : PY + 0.1, w: PW * 0.96, ry: -8, rz: 1 },
            ]}
          />
          <div style={{ ...textBox, textAlign: wide ? "left" : "center" }}>
            {(() => {
              const p = spring({ frame: (t - 4.6) * fps, fps, config: { damping: 12, stiffness: 160 } });
              return (
                <div style={{ transform: `scale(${0.7 + p * 0.3})`, opacity: Math.min(1, p * 1.5), transformOrigin: wide ? "left center" : "center" }}>
                  <Lockup size={(wide ? 130 : 150) * u} />
                </div>
              );
            })()}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14 * u, justifyContent: wide ? "flex-start" : "center", marginTop: 34 * u }}>
              {["Cleaning", "Handyman", "Plumbing", "Pool", "Lawn"].map((x, i) => {
                const p = spring({ frame: (t - (wordAt("2", 5) + i * 0.12)) * fps, fps, config: { damping: 14, stiffness: 200 } });
                return (
                  <div key={x} style={{ fontFamily: archivo, fontWeight: 700, fontSize: 36 * u, color: WHITE, padding: `${10 * u}px ${20 * u}px`, borderRadius: 999, border: `2px solid rgba(255,255,255,0.18)`, background: "rgba(255,255,255,0.06)", opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 20 * u}px)` }}>
                    {x}
                  </div>
                );
              })}
            </div>
          </div>
          <Sfx kind="slam" frame={F(4.6)} gain={0.8} />
          <Sfx kind="whoosh" frame={F(S2)} />
        </>
      ) : null}

      {/* 3 — Sell on one signature: build the quote, then the sent quote (one-off + repeating) */}
      {between(S3, S4) ? (
        <>
          {t < 9.75 ? (
            <Phone
              src="sw-14-lead-quote.png"
              t={t}
              keys={[
                { t: S3, x: PX, y: PY + 0.3, w: PW, f: px(603, 900), rx: 25 },
                { t: S3 + 0.5, x: PX, y: PY, w: PW, f: px(603, 900), rx: 0, ry: 10 },
                { t: 8.4, x: PX, y: PY, w: PW * 1.5, f: px(800, 880), ry: 6 },
                { t: 9.75, x: PX, y: PY, w: PW * 1.6, f: px(800, 900), ry: 4 },
              ]}
              taps={[{ t: 8.7, at: px(1032, 889) }, { t: 9.15, at: px(1032, 1015) }]}
            />
          ) : (
            <Phone
              src="sw-16-quote-detail.png"
              t={t}
              fadeIn={0.08}
              keys={[
                { t: 9.75, x: PX + 0.08, y: PY, w: PW * 1.1, f: px(603, 700), ry: -28 },
                { t: 10.25, x: PX, y: PY, w: PW * 1.45, f: px(603, 720), ry: -10, rz: -1 },
                { t: S4, x: PX, y: PY, w: PW * 1.55, f: px(603, 740), ry: -6, rz: -1 },
              ]}
              ring={{ t: 10.5, box: [...px(40, 690), ...px(1166, 945)] as [number, number, number, number] }}
            />
          )}
          <Sfx kind="whoosh" frame={F(S3)} />
          <Sfx kind="pop" frame={F(8.7)} />
          <Sfx kind="pop" frame={F(9.15)} />
          <Sfx kind="whoosh" frame={F(9.7)} gain={0.8} />
        </>
      ) : null}

      {/* 4 — Run the day: stops, map, checklist, photos — one cut per spoken item, alternating angles */}
      {between(S4, S5) ? (
        <>
          {t < c4[1] - 0.05 ? (
            <Phone
              src="sw-02-today.png"
              t={t}
              keys={[
                { t: S4, x: PX, y: PY + 0.02, w: PW * 0.9, f: px(603, 1311), ry: 18, rz: -2 },
                { t: c4[0], x: PX, y: PY, w: PW * 1.0, f: px(603, 1311), ry: 8 },
                { t: c4[1], x: PX, y: PY - 0.02, w: PW * 1.45, f: px(603, 900), ry: 4 },
              ]}
              taps={[{ t: c4[0] + 0.35, at: px(601, 1062) }]}
            />
          ) : t < c4[2] - 0.05 ? (
            <Phone
              src="sw-36-day-map.png"
              t={t}
              fadeIn={0.06}
              keys={[
                { t: c4[1] - 0.05, x: PX, y: PY, w: PW * 1.0, f: px(594, 1100), ry: -20, rx: 8 },
                { t: c4[2], x: PX, y: PY, w: PW * 1.25, f: px(594, 1050), ry: -8, rx: 4 },
              ]}
            />
          ) : t < c4[3] - 0.05 ? (
            <Phone
              src="sw-19-checklist.png"
              t={t}
              fadeIn={0.06}
              keys={[
                { t: c4[2] - 0.05, x: PX, y: PY, w: PW * 1.0, f: px(603, 640), ry: 20, rz: 2 },
                { t: c4[3], x: PX, y: PY, w: PW * 1.5, f: px(603, 620), ry: 6, rz: 1 },
              ]}
              taps={[{ t: c4[2] + 0.3, at: px(113, 514) }, { t: c4[2] + 0.7, at: px(113, 736) }]}
            />
          ) : (
            <Phone
              src="sw-22-photo-editor.png"
              t={t}
              fadeIn={0.06}
              keys={[
                { t: c4[3] - 0.05, x: PX, y: PY, w: PW * 1.0, f: px(603, 1300), ry: -18, rz: -2 },
                { t: S5, x: PX, y: PY, w: PW * 1.12, f: px(603, 1250), ry: -6, rz: -1 },
              ]}
              taps={[{ t: c4[3] + 0.3, at: px(257, 2022) }, { t: c4[3] + 0.75, at: px(583, 1019) }]}
            />
          )}
          <Sfx kind="whoosh" frame={F(S4)} />
          {c4.slice(1).map((c, i) => <Sfx key={i} kind="whoosh" frame={F(c - 0.08)} gain={0.7} />)}
          <Sfx kind="pop" frame={F(c4[0] + 0.35)} />
          <Sfx kind="tick" frame={F(c4[2] + 0.3)} />
          <Sfx kind="tick" frame={F(c4[2] + 0.7)} />
          <Sfx kind="pop" frame={F(c4[3] + 0.3)} />
        </>
      ) : null}

      {/* 5 — Found more work? The visit screen pans down to "Found something?" */}
      {between(S5, S6) ? (
        <>
          <Phone
            src="sw-10-visit-detail.png"
            t={t}
            keys={[
              { t: S5, x: PX, y: PY + 0.04, w: PW * 1.0, f: px(603, 900), ry: 22, rx: 6 },
              { t: 18.6, x: PX, y: PY, w: PW * 1.25, f: px(603, 1100), ry: 8 },
              { t: 19.6, x: PX, y: PY, w: PW * 1.6, f: px(603, 1741), ry: 4 },
              { t: S6, x: PX, y: PY, w: PW * 1.7, f: px(603, 1741), ry: 2 },
            ]}
            ring={{ t: 19.65, box: [...px(15, 1660), ...px(1191, 1830)] as [number, number, number, number] }}
            taps={[{ t: 20.3, at: px(500, 1741) }]}
          />
          <Sfx kind="whoosh" frame={F(S5)} />
          <Sfx kind="tick" frame={F(19.65)} />
          <Sfx kind="pop" frame={F(20.3)} />
        </>
      ) : null}

      {/* 6 — Tap done: the sign-off, then the paid invoice */}
      {between(S6, S7) ? (
        <>
          {t < 22.75 ? (
            <Phone
              src="sw-23-signoff.png"
              t={t}
              keys={[
                { t: S6, x: PX, y: PY + 0.25, w: PW * 1.2, f: px(603, 650), rx: 30 },
                { t: S6 + 0.45, x: PX, y: PY, w: PW * 1.55, f: px(603, 650), rx: 4 },
                { t: 22.75, x: PX, y: PY, w: PW * 1.7, f: px(603, 640) },
              ]}
              ring={{ t: 21.6, box: [...px(30, 380), ...px(1176, 720)] as [number, number, number, number] }}
            />
          ) : (
            <Phone
              src="sw-25-invoice-detail.png"
              t={t}
              fadeIn={0.06}
              keys={[
                { t: 22.75, x: PX, y: PY, w: PW * 1.2, f: px(603, 650), ry: -24 },
                { t: 23.25, x: PX, y: PY, w: PW * 1.6, f: px(780, 620), ry: -6 },
                { t: S7, x: PX, y: PY, w: PW * 1.7, f: px(800, 620), ry: -4 },
              ]}
              ring={{ t: 23.1, box: [...px(870, 530), ...px(1180, 640)] as [number, number, number, number] }}
            />
          )}
          <Sfx kind="whoosh" frame={F(S6)} />
          <Sfx kind="whoosh" frame={F(22.7)} gain={0.8} />
          <Sfx kind="tick" frame={F(23.1)} />
        </>
      ) : null}

      {/* 7 — Who paid, who still owes: the Money screen */}
      {between(S7, S8) ? (
        <>
          <Phone
            src="sw-06-money.png"
            t={t}
            keys={[
              { t: S7, x: PX, y: PY + 0.02, w: PW * 1.0, f: px(603, 800), ry: 24, rz: 3 },
              { t: 24.5, x: PX, y: PY, w: PW * 1.55, f: px(603, 650), ry: 8, rz: 1 },
              { t: 26.4, x: PX, y: PY, w: PW * 1.55, f: px(603, 700), ry: 4 },
              { t: S8, x: PX, y: PY, w: PW * 1.2, f: px(603, 900), ry: -6 },
            ]}
            ring={{ t: wordAt("5b", 3), box: [...px(40, 480), ...px(380, 820)] as [number, number, number, number] }}
          />
          {t >= wordAt("5b", 6) - 0.05 ? (
            <Phone
              src="sw-06-money.png"
              t={t}
              fadeIn={0.01}
              keys={[{ t: wordAt("5b", 6) - 0.05, x: PX, y: PY, w: PW * 1.55, f: px(603, 650), ry: 8, rz: 1 }, { t: 26.4, x: PX, y: PY, w: PW * 1.55, f: px(603, 700), ry: 4 }, { t: S8, x: PX, y: PY, w: PW * 1.2, f: px(603, 900), ry: -6 }]}
              ring={{ t: wordAt("5b", 6), box: [...px(400, 480), ...px(720, 820)] as [number, number, number, number] }}
            />
          ) : null}
          <Sfx kind="whoosh" frame={F(S7)} />
          <Sfx kind="tick" frame={F(wordAt("5b", 3))} />
          <Sfx kind="tick" frame={F(wordAt("5b", 6))} />
        </>
      ) : null}

      {/* 8 — Title: three real screens fanned in 3D under "Tap done. You're paid." */}
      {between(S8, S9) ? (
        <>
          {[
            { src: "sw-16-quote-detail.png", dx: wide ? -0.17 : -0.28, ry: 28, rz: -6, d: 0.0 },
            { src: "sw-06-money.png", dx: wide ? 0.17 : 0.28, ry: -28, rz: 6, d: 0.08 },
            { src: "sw-02-today.png", dx: 0, ry: 0, rz: 0, d: 0.16 },
          ].map((p, i) => {
            const cx = wide ? 0.5 : 0.5;
            const cy = wide ? 0.66 : 0.66;
            return (
              <Phone
                key={i}
                src={p.src}
                t={t}
                keys={[
                  { t: S8 + p.d, x: cx, y: cy + 0.5, w: PW * 0.8, rx: 35 },
                  { t: S8 + p.d + 0.6, x: cx + p.dx, y: cy + (i === 2 ? 0 : 0.03), w: PW * (i === 2 ? 0.86 : 0.74), ry: p.ry, rz: p.rz, rx: 6 },
                  { t: S9, x: cx + p.dx * 1.04, y: cy + (i === 2 ? -0.01 : 0.02), w: PW * (i === 2 ? 0.9 : 0.76), ry: p.ry * 0.9, rz: p.rz, rx: 4 },
                ]}
              />
            );
          })}
          <div style={{ position: "absolute", left: 0, right: 0, top: wide ? height * 0.07 : height * 0.1, textAlign: "center" }}>
            {(() => {
              const p = spring({ frame: (t - 28.1) * fps, fps, config: { damping: 12, stiffness: 160 } });
              return (
                <div style={{ transform: `scale(${0.75 + p * 0.25})`, opacity: Math.min(1, p * 1.5) }}>
                  <Lockup size={(wide ? 96 : 120) * u} />
                </div>
              );
            })()}
            <div style={{ marginTop: 24 * u }}>
              <Kinetic t={t} size={(wide ? 84 : 96) * u} words={line("6").words.slice(1).map((w, i) => ({ w: w.w, s: w.s, hot: i >= 2 }))} />
            </div>
          </div>
          <Sfx kind="swell" frame={F(S8 - 0.4)} />
          <Sfx kind="slam" frame={F(28.1)} gain={0.7} />
        </>
      ) : null}

      {/* 9 — ProofWright end card, CTA = the site's real one (surewright.app beta) */}
      <Sequence from={F(S9)}>
        <LogoEndCard brand="proofwright" cta="Save your spot in the beta" url="surewright.app" />
      </Sequence>

      {t >= S3 && t < S8 ? <AbsoluteFill style={{ background: `linear-gradient(${INK} 0%, ${INK} ${wide ? 0 : 9}%, rgba(10,11,14,0) ${wide ? 0 : 17}%)`, pointerEvents: "none" }} /> : null}
      {t >= S3 && t < S8 ? (
        <div style={textBox}>
          {[["Sell on one signature", S3, S4], ["Run the day from your phone", S4, S5], ["Quote it on the spot", S5, S6], ["Get paid without asking", S6, S7], ["Who paid. Who owes.", S7, S8]].map(([k, a, b]) =>
            t >= (a as number) && t < (b as number) ? <Kicker key={k as string} text={k as string} t={t} from={a as number} to={b as number} u={u} /> : null
          )}
        </div>
      ) : null}
      <Captions lines={timeline.lines} t={t} skip={["1", "6", "7"]} />

      {timeline.lines.map((l) => (
        <Sequence key={l.id} from={F(l.t0)} layout="none">
          <Audio src={staticFile(l.src)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
