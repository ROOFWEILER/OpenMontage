import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { StyleTokens, envelope, onColor, tokens } from "./shared";

/**
 * NotificationStack — phone notifications drop in from the top and stack
 * ("Payment received", "Job confirmed"), older ones pushed down and dimmed.
 * Code-drawn iOS-style banners; the words must be the product's real
 * notification copy with sample-data amounts, never a real customer.
 */
export interface StackNotification { app?: string; title: string; body?: string; time?: string }
export interface NotificationStackProps extends StyleTokens {
  notifications: StackNotification[];
  itemSeconds?: number[];
  top?: number; // 0-1 of height
}

export const NotificationStack: React.FC<NotificationStackProps> = ({ notifications, itemSeconds, top = 0.07, ...style }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();
  const t = tokens(style);
  const { visible } = envelope(frame, fps, durationInFrames, { outFrames: 10 });
  const at = (i: number) => (itemSeconds?.[i] != null ? itemSeconds[i] * fps : fps * 0.2 + i * fps * 0.7);
  const W = width * 0.9, cardH = 170, gap = 18;
  const shown = notifications.map((_, i) => i).filter((i) => frame >= at(i));
  return (
    <AbsoluteFill style={{ opacity: visible }}>
      {notifications.map((n, i) => {
        if (frame < at(i)) return null;
        const drop = spring({ frame: frame - at(i), fps, config: { damping: 14, stiffness: 170 } });
        const newer = shown.filter((j) => j > i).length; // how many arrived after me
        const y = height * top + newer * (cardH + gap) * 0.62;
        return (
          <div key={i} style={{ position: "absolute", left: (width - W) / 2, top: y + interpolate(drop, [0, 1], [-cardH * 1.4, 0]), width: W, height: cardH, borderRadius: 40, padding: "24px 30px", boxSizing: "border-box", background: "rgba(245,245,247,0.86)", backdropFilter: "blur(24px)", boxShadow: "0 18px 40px rgba(0,0,0,0.35)", fontFamily: "-apple-system, 'SF Pro Text', Inter, sans-serif", display: "flex", gap: 22, alignItems: "center", transform: `scale(${1 - newer * 0.05})`, opacity: Math.max(0.35, 1 - newer * 0.25), zIndex: 100 + i }}>
            <div style={{ width: 84, height: 84, borderRadius: 20, flex: "0 0 auto", background: t.accent, display: "flex", alignItems: "center", justifyContent: "center", color: onColor(t.accent), fontWeight: 900, fontSize: 34, fontFamily: t.font }}>{(n.app ?? "").slice(0, 2).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#6b6b70", fontSize: 26, fontWeight: 600, textTransform: "uppercase" }}>
                <span>{n.app}</span>
                <span style={{ textTransform: "none" }}>{n.time ?? "now"}</span>
              </div>
              <div style={{ color: "#111", fontSize: 36, fontWeight: 700, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.title}</div>
              {n.body ? <div style={{ color: "#333", fontSize: 30, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.body}</div> : null}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
