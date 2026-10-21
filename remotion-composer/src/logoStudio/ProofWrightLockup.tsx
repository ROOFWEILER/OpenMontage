import React from "react";
import { AbsoluteFill } from "remotion";
import { loadArchivo } from "../lib/localFonts";

/**
 * ProofWright's CURRENT logo (David 2026-10-21: the italic-serif "PW" PNG is the old mark).
 * On proofwright.ai the header logo is HTML/CSS, not an image file:
 *   <a class="brandline"><span class="mk">PW</span><span class="wm">Proof<span class="wr">Wright</span></span></a>
 * These values are the live site's COMPUTED styles (read 2026-10-21), multiplied by SCALE:
 *   a.brandline  flex, align-items center, gap 9px, Archivo 700 15.5px, letter-spacing -0.31px, #FFFFFF
 *   .mk          26x26, radius 7px, bg #FFB000, color #1A0800, Archivo 800 11px, grid place-items center
 *   .wr          color #FFB000
 * Rendered once (transparent) to public/logo-studio/proofwright-lockup.png by the
 * LogoStudioProofWrightLockup composition; the logo studio uses that PNG like every other brand.
 */
export const PW_LOCKUP_SCALE = 12;
export const PW_LOCKUP_SIZE = { width: Math.ceil(121 * PW_LOCKUP_SCALE), height: 26 * PW_LOCKUP_SCALE };

const archivo = loadArchivo(["700", "800"]).fontFamily;

export const ProofWrightLockup: React.FC = () => {
  const s = PW_LOCKUP_SCALE;
  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 * s, height: 26 * s, fontFamily: archivo, fontWeight: 700, fontSize: 15.5 * s, letterSpacing: -0.31 * s, color: "#FFFFFF", whiteSpace: "nowrap" }}>
        <span style={{ display: "grid", placeItems: "center", width: 26 * s, height: 26 * s, borderRadius: 7 * s, background: "#FFB000", color: "#1A0800", fontWeight: 800, fontSize: 11 * s, flexShrink: 0 }}>PW</span>
        <span>
          Proof<span style={{ color: "#FFB000" }}>Wright</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};
