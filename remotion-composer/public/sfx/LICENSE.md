# Style-pack sound effects — license

| File | Used by | What it is |
|---|---|---|
| `tick.wav` | `checklist` (per item), `step_tracker` (per step) | soft UI tick, 60 ms |
| `pop.wav` | `notification_stack` (per banner) | rounded notification pop, 160 ms |
| `whoosh.wav` | `transitions: zoom_through` | air rush peaking 0.25 s in, panned L→R |
| `swell.wav` | `chart_grow` (once, as the bars start) | soft rising pad, 1.3 s |
| `slam.wav` | `headline_wall` (per card) | light thump + paper slap, 300 ms |
| `sting.wav` | logo studio `LogoEndCard` (once, under the whole card) | air lift into a warm open chord, slow decay, 2.5 s |

**Source:** synthesized from sine waves and seeded noise by
`remotion-composer/scripts/make_sfx.py` (OpenMontage / Roofweiler LLC, 2026-10-21).
No sample, recording, or third-party sound is used, so there is nothing to attribute.

**License:** CC0 1.0 Universal (public domain dedication),
https://creativecommons.org/publicdomain/zero/1.0/ — free for commercial use, no attribution.

Regenerate (same bytes every run): `uv run --with numpy python remotion-composer/scripts/make_sfx.py`
