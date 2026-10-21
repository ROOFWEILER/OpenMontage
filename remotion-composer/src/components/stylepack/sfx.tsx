import { createContext, useContext } from "react";
import { Audio, Sequence, staticFile } from "remotion";

/**
 * Style-pack sound effects: short CC0 sounds (public/sfx/, see LICENSE.md)
 * fired on the exact frame an effect moves, so the timing comes from the same
 * numbers that drive the motion. Levels sit well under the VO; a brand scales
 * them with `sfxVolume` and limits them with `sfxKinds` (style card
 * `style_pack.sfx`), and TalkingHead `sfx: false` silences them all.
 */
export type SfxKind = "whoosh" | "tick" | "pop" | "swell" | "slam";

/** Base gain per sound (files peak at -3 dBFS); keeps each one under a talking voice. */
const BASE: Record<SfxKind, number> = { whoosh: 0.22, tick: 0.3, pop: 0.26, swell: 0.16, slam: 0.28 };

export interface SfxSettings { enabled: boolean; volume: number; kinds?: SfxKind[] }

export const SfxContext = createContext<SfxSettings>({ enabled: true, volume: 1 });

/** Plays one sound starting at `frame` (relative to the enclosing Sequence). */
export const Sfx: React.FC<{ kind: SfxKind; frame: number; gain?: number }> = ({ kind, frame, gain = 1 }) => {
  const s = useContext(SfxContext);
  if (!s.enabled || (s.kinds && !s.kinds.includes(kind))) return null;
  return (
    <Sequence from={Math.max(0, Math.round(frame))} layout="none">
      <Audio src={staticFile(`sfx/${kind}.wav`)} volume={BASE[kind] * s.volume * gain} />
    </Sequence>
  );
};
