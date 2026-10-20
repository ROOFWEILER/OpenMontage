import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CaptionOverlay, WordCaption } from "./components/CaptionOverlay";
import { resolveAsset } from "./lib/resolveAsset";
import { TextCard } from "./components/TextCard";
import { StatCard } from "./components/StatCard";
import { CalloutBox } from "./components/CalloutBox";
import { ComparisonCard } from "./components/ComparisonCard";
import { BarChart } from "./components/charts/BarChart";
import { LineChart } from "./components/charts/LineChart";
import { PieChart } from "./components/charts/PieChart";
import { KPIGrid } from "./components/charts/KPIGrid";
import { HeroTitle } from "./components/HeroTitle";
import { SectionTitle } from "./components/SectionTitle";
import { StatReveal } from "./components/StatReveal";
import { PhoneMockup } from "./components/stylepack/PhoneMockup";
import { UIWorld, UIWorldCard } from "./components/stylepack/UIWorld";
import { Checklist } from "./components/stylepack/Checklist";
import { ChartGrow } from "./components/stylepack/ChartGrow";
import { TextBehind } from "./components/stylepack/TextBehind";
import { StyleTokens } from "./components/stylepack/shared";

// ---------------------------------------------------------------------------
// Overlay types for talking-head video
// ---------------------------------------------------------------------------

export interface TalkingHeadOverlay {
  id?: string;
  type: string;
  in_seconds: number;
  out_seconds: number;
  position?:
    | "lower_third"
    | "upper_third"
    | "left_panel"
    | "right_panel"
    | "full_overlay";
  // Component-specific props (same as Explainer Cut)
  text?: string;
  stat?: string;
  subtitle?: string;
  callout_type?: "info" | "warning" | "tip" | "quote";
  title?: string;
  leftLabel?: string;
  rightLabel?: string;
  leftValue?: string;
  rightValue?: string;
  chartData?: any[];
  chartSeries?: any[];
  chartColors?: string[];
  chartAnimation?: string;
  donut?: boolean;
  centerLabel?: string;
  centerValue?: string;
  showGrid?: boolean;
  showValues?: boolean;
  showLegend?: boolean;
  showMarkers?: boolean;
  columns?: 2 | 3 | 4;
  // Style-pack effects (phone_mockup, ui_world, checklist, chart_grow, text_behind)
  screenSrc?: string;
  mockupSrc?: string;
  side?: "left" | "right" | "center";
  label?: string;
  scrollFraction?: number;
  tapAt?: [number, number];
  tapAtSeconds?: number;
  cards?: UIWorldCard[];
  items?: string[];
  itemSeconds?: number[];
  headline?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  highlightIndex?: number;
  placement?: "lower" | "center" | "upper";
  top?: number;
  /** "behind" = between the background video and the presenter matte. */
  layer?: "behind" | "front";
  // Styling
  backgroundColor?: string;
  color?: string;
  accentColor?: string;
  fontSize?: number;
}

// ---------------------------------------------------------------------------
// Position presets for 9:16 (1080x1920) frame
// ---------------------------------------------------------------------------

const POSITION_STYLES: Record<string, React.CSSProperties> = {
  lower_third: {
    position: "absolute",
    bottom: 320, // Above caption area (~1600px)
    left: 40,
    right: 40,
    height: 480,
  },
  upper_third: {
    position: "absolute",
    top: 80,
    left: 40,
    right: 40,
    height: 480,
  },
  left_panel: {
    position: "absolute",
    top: 200,
    left: 40,
    width: 480,
    bottom: 400,
  },
  right_panel: {
    position: "absolute",
    top: 200,
    right: 40,
    width: 480,
    bottom: 400,
  },
  full_overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
};

// ---------------------------------------------------------------------------
// Overlay component dispatcher — maps overlay type to Remotion component
// ---------------------------------------------------------------------------

const STYLE_PACK_TYPES = ["phone_mockup", "ui_world", "checklist", "chart_grow", "text_behind"];

const OverlayContent: React.FC<{ overlay: TalkingHeadOverlay; styleTokens?: StyleTokens; only?: "back" | "front" }> = ({
  overlay,
  styleTokens,
  only,
}) => {
  const bgColor = overlay.backgroundColor || "#0F172A";
  const st: StyleTokens = {
    ...styleTokens,
    ...(overlay.accentColor ? { accentColor: overlay.accentColor } : {}),
    ...(overlay.color ? { textColor: overlay.color } : {}),
    ...(overlay.backgroundColor ? { surfaceColor: overlay.backgroundColor } : {}),
  };

  if (overlay.type === "phone_mockup" && (overlay.screenSrc || overlay.mockupSrc)) {
    return (
      <PhoneMockup
        {...st}
        screenSrc={overlay.screenSrc}
        mockupSrc={overlay.mockupSrc}
        side={overlay.side}
        label={overlay.label}
        scrollFraction={overlay.scrollFraction}
        tapAt={overlay.tapAt}
        tapAtSeconds={overlay.tapAtSeconds}
      />
    );
  }
  if (overlay.type === "ui_world" && overlay.cards?.length) {
    return <UIWorld {...st} cards={overlay.cards} only={only} />;
  }
  if (overlay.type === "checklist" && overlay.items?.length) {
    return <Checklist {...st} items={overlay.items} title={overlay.title} itemSeconds={overlay.itemSeconds} position={overlay.placement} />;
  }
  if (overlay.type === "chart_grow" && overlay.chartData?.length) {
    return (
      <ChartGrow
        {...st}
        data={overlay.chartData}
        title={overlay.title}
        headline={overlay.headline}
        valuePrefix={overlay.valuePrefix}
        valueSuffix={overlay.valueSuffix}
        highlightIndex={overlay.highlightIndex}
        position={overlay.placement}
      />
    );
  }
  if (overlay.type === "text_behind" && overlay.text) {
    return <TextBehind {...st} text={overlay.text} subtitle={overlay.subtitle} top={overlay.top} fontSize={overlay.fontSize} />;
  }

  if (overlay.type === "text_card" && overlay.text) {
    return (
      <TextCard
        text={overlay.text}
        fontSize={overlay.fontSize}
        color={overlay.color}
        backgroundColor={bgColor}
      />
    );
  }
  if (overlay.type === "stat_card" && overlay.stat) {
    return (
      <StatCard
        stat={overlay.stat}
        subtitle={overlay.subtitle}
        accentColor={overlay.accentColor}
        backgroundColor={bgColor}
      />
    );
  }
  if (overlay.type === "callout" && overlay.text) {
    return (
      <CalloutBox
        text={overlay.text}
        type={overlay.callout_type}
        title={overlay.title}
        borderColor={overlay.accentColor}
        backgroundColor={overlay.backgroundColor}
        textColor={overlay.color}
        containerBackgroundColor={bgColor}
      />
    );
  }
  if (
    overlay.type === "comparison" &&
    overlay.leftLabel &&
    overlay.rightLabel
  ) {
    return (
      <ComparisonCard
        leftLabel={overlay.leftLabel}
        rightLabel={overlay.rightLabel}
        leftValue={overlay.leftValue || ""}
        rightValue={overlay.rightValue || ""}
        title={overlay.title}
        backgroundColor={bgColor}
        textColor={overlay.color}
      />
    );
  }
  if (overlay.type === "bar_chart" && overlay.chartData) {
    return (
      <BarChart
        data={overlay.chartData}
        title={overlay.title}
        colors={overlay.chartColors}
        animationStyle={(overlay.chartAnimation as any) || "grow-up"}
        showValues={overlay.showValues}
        backgroundColor={bgColor}
      />
    );
  }
  if (overlay.type === "line_chart" && overlay.chartSeries) {
    return (
      <LineChart
        series={overlay.chartSeries}
        title={overlay.title}
        colors={overlay.chartColors}
        animationStyle={(overlay.chartAnimation as any) || "draw"}
        showGrid={overlay.showGrid}
        showMarkers={overlay.showMarkers}
        showLegend={overlay.showLegend}
        backgroundColor={bgColor}
      />
    );
  }
  if (overlay.type === "pie_chart" && overlay.chartData) {
    return (
      <PieChart
        data={overlay.chartData}
        title={overlay.title}
        colors={overlay.chartColors}
        animationStyle={(overlay.chartAnimation as any) || "expand"}
        donut={overlay.donut}
        centerLabel={overlay.centerLabel}
        centerValue={overlay.centerValue}
        showLegend={overlay.showLegend}
        backgroundColor={bgColor}
      />
    );
  }
  if (overlay.type === "kpi_grid" && overlay.chartData) {
    return (
      <KPIGrid
        metrics={overlay.chartData}
        title={overlay.title}
        columns={overlay.columns}
        colors={overlay.chartColors}
        animationStyle={(overlay.chartAnimation as any) || "count-up"}
        backgroundColor={bgColor}
      />
    );
  }
  if (overlay.type === "hero_title" && overlay.text) {
    return <HeroTitle title={overlay.text} subtitle={overlay.subtitle} />;
  }
  if (overlay.type === "section_title" && overlay.text) {
    return (
      <SectionTitle
        title={overlay.text}
        subtitle={overlay.subtitle}
        accentColor={overlay.accentColor}
        position="top-left"
      />
    );
  }
  if (overlay.type === "stat_reveal" && overlay.text) {
    return (
      <StatReveal
        stat={overlay.text}
        label={overlay.subtitle}
        accentColor={overlay.accentColor}
        position="bottom-right"
      />
    );
  }
  return null;
};

// ---------------------------------------------------------------------------
// Positioned overlay wrapper — handles position + fade in/out
// ---------------------------------------------------------------------------

const PositionedOverlay: React.FC<{ overlay: TalkingHeadOverlay; styleTokens?: StyleTokens; only?: "back" | "front" }> = ({
  overlay,
  styleTokens,
  only,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Fade in over 8 frames (~0.27s), fade out over 8 frames
  const fadeIn = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 8, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = fadeIn * fadeOut;

  if (STYLE_PACK_TYPES.includes(overlay.type)) {
    // Full-frame effects that run their own enter/exit motion.
    return (
      <AbsoluteFill>
        <OverlayContent overlay={overlay} styleTokens={styleTokens} only={only} />
      </AbsoluteFill>
    );
  }

  const position = overlay.position || "lower_third";
  const posStyle = POSITION_STYLES[position] || POSITION_STYLES.lower_third;
  const isFullOverlay = position === "full_overlay";

  return (
    <div
      style={{
        ...posStyle,
        opacity,
        overflow: "hidden",
        borderRadius: isFullOverlay ? 0 : 16,
        boxShadow: isFullOverlay
          ? "none"
          : "0 8px 32px rgba(0, 0, 0, 0.4)",
      }}
    >
      {isFullOverlay && (
        <AbsoluteFill style={{ background: "rgba(0, 0, 0, 0.7)" }} />
      )}
      <OverlayContent overlay={overlay} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main TalkingHead composition
// ---------------------------------------------------------------------------

export interface TalkingHeadProps {
  [key: string]: unknown;
  videoSrc: string;
  captions: WordCaption[];
  overlays?: TalkingHeadOverlay[];
  wordsPerPage?: number;
  fontSize?: number;
  highlightColor?: string;
  captionColor?: string;
  captionBackgroundColor?: string;
  captionFontFamily?: string;
  // Pass "" for CJK captions (no inter-word spacing); defaults to " ".
  captionWordSeparator?: string;
  captionBottomOffset?: number;
  captionHighlightMode?: "karaoke" | "emphasis";
  /** Alpha video of the presenter alone (bg_remove.py video mode). When set,
   *  "behind" overlays (text_behind, the far side of ui_world) render between
   *  the background and the presenter. */
  foregroundMatteSrc?: string;
  /** Brand style-card tokens applied to every style-pack effect. */
  styleTokens?: StyleTokens;
}

export const TalkingHead: React.FC<TalkingHeadProps> = ({
  videoSrc,
  captions,
  overlays,
  wordsPerPage = 4,
  fontSize = 52,
  highlightColor = "#22D3EE",
  captionColor = "#FFFFFF",
  captionBackgroundColor = "rgba(0, 0, 0, 0.65)",
  captionFontFamily,
  captionWordSeparator,
  captionBottomOffset,
  captionHighlightMode,
  foregroundMatteSrc,
  styleTokens,
}) => {
  const { fps } = useVideoConfig();
  const seq = (overlay: TalkingHeadOverlay, i: number, only?: "back" | "front") => (
    <Sequence
      key={`${overlay.id || `overlay-${i}`}-${only ?? "all"}`}
      from={Math.round(overlay.in_seconds * fps)}
      durationInFrames={Math.round((overlay.out_seconds - overlay.in_seconds) * fps)}
    >
      <PositionedOverlay overlay={overlay} styleTokens={styleTokens} only={only} />
    </Sequence>
  );
  const isBehind = (o: TalkingHeadOverlay) => !!foregroundMatteSrc && (o.layer === "behind" || o.type === "text_behind");
  const splitsAroundMatte = (o: TalkingHeadOverlay) => !!foregroundMatteSrc && o.type === "ui_world" && o.layer !== "front";

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Layer 1: Video background */}
      <OffthreadVideo
        src={resolveAsset(videoSrc)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* Layer 2a: behind-the-presenter overlays, then the presenter matte */}
      {foregroundMatteSrc && (
        <>
          {overlays?.map((o, i) => (isBehind(o) ? seq(o, i) : splitsAroundMatte(o) ? seq(o, i, "back") : null))}
          <OffthreadVideo
            src={resolveAsset(foregroundMatteSrc)}
            transparent
            muted
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        </>
      )}

      {/* Layer 2b: overlays in front (charts, stats, callouts, effects) */}
      {overlays?.map((o, i) => (isBehind(o) ? null : splitsAroundMatte(o) ? seq(o, i, "front") : seq(o, i)))}

      {/* Layer 3: Captions (topmost — always visible above overlays) */}
      <CaptionOverlay
        words={captions}
        wordsPerPage={wordsPerPage}
        fontSize={fontSize}
        highlightColor={highlightColor}
        backgroundColor={captionBackgroundColor}
        color={captionColor}
        {...(captionFontFamily ? { fontFamily: captionFontFamily } : {})}
        {...(captionWordSeparator !== undefined ? { wordSeparator: captionWordSeparator } : {})}
        {...(captionBottomOffset !== undefined ? { bottomOffset: captionBottomOffset } : {})}
        {...(captionHighlightMode ? { highlightMode: captionHighlightMode } : {})}
      />
    </AbsoluteFill>
  );
};
