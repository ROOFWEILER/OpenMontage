import { Easing, interpolate } from "remotion";

/**
 * Motion basics (style pack 2). Pure frame → transform math, so the camera
 * moves the same on every render.
 *
 * punchInScale: a quick push on the presenter at an emphasis moment —
 *   0.15 s ease in, hold, 0.35 s ease out. Overlapping punch-ins take the max.
 * zoomThrough: a whoosh at a beat change — the frame rushes forward with a
 *   motion blur for 0.2 s, then settles back over 0.25 s.
 */
export interface PunchIn { at: number; duration?: number; scale?: number }
export interface Transition { at: number; type?: "zoom_through" }

const ease = Easing.bezier(0.33, 0, 0.2, 1);

export const punchInScale = (t: number, punchIns: PunchIn[] = []) =>
  punchIns.reduce((acc, p) => {
    const d = p.duration ?? 1.2;
    const s = p.scale ?? 1.12;
    const v = interpolate(t, [p.at, p.at + 0.15, p.at + d - 0.35, p.at + d], [1, s, s, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    });
    return Math.max(acc, v);
  }, 1);

export const zoomThrough = (t: number, transitions: Transition[] = []) => {
  let scale = 1;
  let blur = 0;
  for (const tr of transitions) {
    const v = interpolate(t, [tr.at - 0.2, tr.at, tr.at + 0.25], [0, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    });
    scale = Math.max(scale, 1 + v * 0.45);
    blur = Math.max(blur, v * 14);
  }
  return { scale, blur };
};
