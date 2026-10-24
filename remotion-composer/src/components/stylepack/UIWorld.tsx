import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { resolveAsset } from "../../lib/resolveAsset";
import { StyleTokens, envelope, float, tokens } from "./shared";

/**
 * UIWorld — app UI cards orbiting the presenter on a tilted ellipse, so the
 * product feels like it surrounds them. Cards on the far side of the orbit
 * shrink, dim and blur; with a presenter matte (TalkingHead
 * `foregroundMatteSrc`) the far-side cards render BEHIND the presenter.
 *
 * A card is either an image crop of a real app screen (`image`, from the App
 * Media Library Current set) or a code-drawn chip (`title` + optional
 * `value`). `only` lets TalkingHead draw the back half behind the matte and
 * the front half in front.
 */
export interface UIWorldCard {
  image?: string;
  title?: string;
  value?: string;
}

export interface UIWorldProps extends StyleTokens {
  cards: UIWorldCard[];
  centerY?: number; // orbit centre, 0-1 of height (presenter's chest): far side passes behind the head
  radiusX?: number; // 0-1 of width
  radiusY?: number; // 0-1 of height
  turns?: number; // orbit turns over the beat
  only?: "back" | "front";
}

export const UIWorld: React.FC<UIWorldProps> = ({
  cards,
  centerY = 0.5,
  radiusX = 0.38,
  radiusY = 0.13,
  turns = 0.35,
  only,
  ...style
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const t = tokens(style);
  const n = Math.max(1, cards.length);
  const spin = interpolate(frame, [0, durationInFrames], [0, turns * 2 * Math.PI]);

  const placed = cards.map((card, i) => {
    const a = (i / n) * 2 * Math.PI + spin + Math.PI / 2;
    const depth = Math.sin(a); // +1 nearest the viewer, -1 behind the presenter
    return { card, i, a, depth };
  });

  return (
    <AbsoluteFill>
      {placed
        .filter((p) => (only === "back" ? p.depth < 0 : only === "front" ? p.depth >= 0 : true))
        .sort((p, q) => p.depth - q.depth)
        .map(({ card, i, a, depth }) => {
          const { enter, visible } = envelope(frame, fps, durationInFrames, { delay: 4 + i * 5, damping: 13 });
          const scale = interpolate(depth, [-1, 1], [0.62, 1.08]) * interpolate(enter, [0, 1], [0.3, 1]);
          const cw = width * (card.image ? 0.3 : 0.34);
          const x = width / 2 + Math.cos(a) * width * radiusX - cw / 2;
          const y = height * centerY + depth * height * radiusY + float(frame, fps, 12, 3.2, i * 1.7) - (card.image ? cw * 0.62 : 70);
          const dim = interpolate(depth, [-1, 1], [0.55, 1]);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: cw,
                transform: `scale(${scale}) rotate(${Math.cos(a) * -6}deg)`,
                opacity: visible * dim,
                filter: depth < -0.2 ? `blur(${(-depth - 0.2) * 5}px)` : "none",
                borderRadius: 28,
                overflow: "hidden",
                background: t.surface,
                border: `2px solid ${t.accent}66`,
                boxShadow: `0 24px 50px rgba(0,0,0,0.45), 0 0 40px ${t.accent}22`,
              }}
            >
              {card.image ? (
                // a 4:5 window on the top of the screen (header + first rows), not the whole tall screenshot
                <div style={{ width: "100%", aspectRatio: "4 / 5", overflow: "hidden" }}>
                  <Img src={resolveAsset(card.image)} style={{ width: "100%", display: "block" }} />
                </div>
              ) : (
                <div style={{ padding: "26px 30px", fontFamily: t.font }}>
                  <div style={{ color: t.muted, fontSize: 30, fontWeight: 500 }}>{card.title}</div>
                  {card.value ? <div style={{ color: t.text, fontSize: 54, fontWeight: 700, marginTop: 6 }}>{card.value}</div> : null}
                  <div style={{ height: 8, borderRadius: 4, marginTop: 16, background: t.accent, width: `${60 + ((i * 17) % 35)}%` }} />
                </div>
              )}
            </div>
          );
        })}
    </AbsoluteFill>
  );
};
