# Remotion Composer — Scene & Overlay Cheat Sheet

Authoritative list of `cut.type` and `overlay.type` values the `Explainer` composition accepts. Each row maps to a dispatch case in `src/Explainer.tsx`.

When you add a new component, append it here and in `src/components/index.ts`.

---

## Cut types (`cut.type`)

| `type` | Component | Required fields | Common fields | Purpose |
|---|---|---|---|---|
| *(none — video)* | `OffthreadVideo` | `source` (path to mp4) | `source_in_seconds`, `animation` (zoom-in, ken-burns), `in_seconds`, `out_seconds` | Play an MP4 clip directly |
| *(none — image)* | `Img` | `source` (path to png/jpg) | `animation`, `in_seconds`, `out_seconds` | Play a still with Ken Burns |
| `text_card` | `TextCard` | `text` | `fontSize`, `backgroundVideo`, `backgroundOverlay`, `color` | Large-typography beat |
| `hero_title` | `HeroTitle` | `text` | `heroSubtitle`, `backgroundVideo`, `backgroundOverlay` | Title/end card |
| `stat_card` | `StatCard` | `stat` | `subtitle`, `accentColor`, `backgroundVideo` | A single big number |
| `callout` | `CalloutBox` | `text` | `callout_type` (info/warning/tip/quote), `title`, `backgroundVideo` | Boxed message with bullets |
| `comparison` | `ComparisonCard` | `leftLabel`, `leftValue`, `rightLabel`, `rightValue` | `title`, `backgroundColor` | Side-by-side compare |
| `bar_chart` | `BarChart` | `chartData` | `chartAnimation`, `showValues`, `showGrid`, `backgroundVideo` | Animated bars |
| `line_chart` | `LineChart` | `chartSeries` | `chartAnimation`, `xLabel`, `yLabel`, `showMarkers` | Animated line |
| `pie_chart` | `PieChart` | `chartData` | `donut`, `centerLabel`, `centerValue`, `showLegend` | Pie / donut |
| `kpi_grid` | `KPIGrid` | `chartData` | `title`, `columns`, `chartAnimation` | 2–4 column KPI grid |
| `progress_bar` | `ProgressBar` | `progress` | `progressLabel`, `progressColor`, `progressSegments` | Animated progress |
| `anime_scene` | `AnimeScene` | `images` (list) | `particles`, `lightingFrom`, `lightingTo`, `vignette` | Still-image anime scene with particles + camera motion |
| **`terminal_scene`** | **`TerminalScene`** | **`steps`** (list of cmd/out/pause/pill) | **`terminalTitle`, `prompt`, `accentColor`** | **Synthetic terminal animation — NO real capture needed. See [`.agents/skills/synthetic-screen-recording/SKILL.md`](../.agents/skills/synthetic-screen-recording/SKILL.md)** |
| **`screenshot_scene`** | **`ScreenshotScene`** | **`backgroundImage`** (path in `public/`), **`screenshotSteps`** (list of overlays) | **`screenshotSize` (natural px w/h), `cursorStartAt`, `accentColor`** | **Approach-1 synthetic UI — drop any screenshot, animate scripted overlays on top (cursor, click_pulse, type_into, bubble_append, typing_dots, highlight_box, callout_balloon). Viewer-indistinguishable from a real recording for 15–30s focused demos. Coordinates are normalized (0–1) against the contain-fit rect. See [`.agents/skills/synthetic-ui-recording/SKILL.md`](../.agents/skills/synthetic-ui-recording/SKILL.md) (planned).** |

---

## Overlay types (`overlay.type`)

| `type` | Component | Required fields | Common fields | Purpose |
|---|---|---|---|---|
| `section_title` | `SectionTitle` | `text` | `accentColor`, `position` (top-left, etc.) | Tiny section label |
| `stat_reveal` | `StatReveal` | `text` | `subtitle`, `accentColor`, `position` | Corner stat badge |
| `hero_title` | `HeroTitle` (as overlay) | `text` | `subtitle` | Full-frame title overlay |
| **`provider_chip`** | **`ProviderChip`** | **`providers`** (list of strings) | **`cycleSeconds`, `position`, `accentColor`, `label`** | **Rotating badge that cycles through provider names — used in AI-generated-motion scenes to show which model produced the clip** |

---

## Adding a new scene type

1. Create the React component in `src/components/MyScene.tsx`. Use `interpolate(frame, [inFrame, outFrame], [from, to])` and `spring(...)` for motion. Read `useCurrentFrame()` and `useVideoConfig()`.
2. Export it in `src/components/index.ts`.
3. Add the `type` to the `Cut` interface in `src/Explainer.tsx` (and any new prop fields).
4. Add a dispatch case in `SceneRenderer`:
   ```tsx
   if (cut.type === "my_scene" && cut.mySceneData) {
     return maybeWrapWithBg(<MyScene ... />);
   }
   ```
5. Document it in this file. That's what makes it discoverable to the next agent.

## Existing synthetic-UI components

Currently only `TerminalScene` exists. The pattern generalizes — likely candidates to add next, if a pipeline needs them:

- `ChatTranscript` — Claude/Cursor/GPT chat-bubble timeline with typing animation
- `EditorScene` — VS Code-style code editor with syntax highlight + cursor motion
- `PrReview` — GitHub PR diff view with inline-comment reveals
- `SlackThread` — Slack thread with avatars + reaction pops
- `TicketBoard` — Jira / Linear card moving across columns

Pattern: follow `TerminalScene.tsx` — a `steps` list of timeline primitives, cursor-advancing durations, spring-based reveals, optional non-blocking pills/badges.

---

## Style-pack overlays (TalkingHead, David 2026-10-20)

Code-drawn, deterministic, $0 per reel. Full-frame overlays on the `TalkingHead` composition that run their own enter/exit motion (`src/components/stylepack/`). Brand colors come from the TalkingHead prop `styleTokens` (copy `style_pack.style_tokens` from `styles/<brand>.yaml`); an overlay's `accentColor`/`color`/`backgroundColor` override them. Which brand may use which effect is in each style card's `style_pack.effects_allowed`.

| `type` | Component | Required fields | Common fields | Purpose |
|---|---|---|---|---|
| `phone_mockup` | `PhoneMockup` | `screenSrc` (unframed) or `mockupSrc` (framed PNG) | `side` (left/right/center), `label`, `scrollFraction`, `tapAt` [x,y], `tapAtSeconds` | A real app screen in an iPhone that rises in, tilts and floats beside the presenter. Screens ONLY from the App Media Library Current set (`~/.claude/references/app-media-library.md`) |
| `ui_world` | `UIWorld` | `cards` [{image} or {title, value}] | `layer: "front"` to keep it all in front | App UI cards orbit the presenter; with `foregroundMatteSrc` the far side passes behind them |
| `checklist` | `Checklist` | `items` | `title`, `itemSeconds` (tick times, s from overlay start), `placement` (lower/center/upper) | Ticks pop and draw one by one |
| `chart_grow` | `ChartGrow` | `chartData` [{label, value}] | `title`, `headline`, `valuePrefix`, `valueSuffix`, `highlightIndex`, `placement` | Bars grow, values count up, one bar in the accent. Only sourced numbers |
| `text_behind` | `TextBehind` | `text` | `subtitle`, `top` (0-1), `fontSize` | Huge title between the background and the presenter (needs `foregroundMatteSrc`; without it, place it above the head) |

**Presenter matte** (`foregroundMatteSrc`): run `bg_remove` on the presenter video — video input writes an alpha VP9 WebM (`{"input_path": "take.mp4", "output_path": "take_matte.webm"}`, needs `pip install rembg`). Overlays with `layer: "behind"` (and every `text_behind`, and the far half of `ui_world`) render under it.
