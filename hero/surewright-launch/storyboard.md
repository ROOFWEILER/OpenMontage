# SureWright launch film — storyboard + provenance (2026-10-21)

Script (VO, Chirp3-HD Charon at 1.1x; captions = these words):
1. You finished the job. So why are you still chasing the money?
2. SureWright is one app for small home-service businesses.
3. Your customer signs the quote once, and their card stays on file.
4. Run the whole day from your phone. Your stops. The map. The checklist. The photos.
4b. Found more work? Photograph it, and quote it before you leave.
5. Tap done, and the visit pays itself.
5b. And see who paid, and who still owes, in one place.
6. SureWright. Tap done. You're paid.
7. Save your spot in the beta, at surewright.app

Claim sources (surewright-web/src/content/copy.ts): kicker "For small home-service businesses" (:8), H1 "Tap done. You're paid." (:9),
"signs the quote once, their card stays on file, and every visit pays itself the minute you finish" (:14), trades (:21),
step labels (:30/:36/:42), CTA "Save my spot in the beta" (:15). Found-something: app screen sw-10 copy "Photograph it and quote it
before you leave" + surewright/src/app/(app)/found. Not claimed: texting customers (On my way is a share sheet), Tap to Pay, reminders.

Screens: App Media Library SureWright/Current (Drive folder 1jA4fxbvT0RnnfmIkLF__B5IDIayySVkM), complete=True,
captured_at=2026-10-18T23:11:06.445167+00:00, source_commit=fa1ffc45683ba380aa57d70a14c2fbc5eaa3694b, fingerprint=42d9fa164b9dd3a8b4050b0e8f7eb854435e5e82241e04fea46ba98a0e769b84. Fetched with ~/.claude/bin/app-media get
(MD5-checked). Mockups only (untouched pixels; camera moves + finger dot drawn on top). Screens are synthetic fixtures (Sofia Mendez,
Blue Ridge Pool Care, $185). Assets are not committed (public repo): stage them into remotion-composer/public/surewright-launch/.

| screen id | path in Current | manifest files |
|---|---|---|
| 02-today | iPhone Mockups/sw-02-today.png | {} |
| 06-money | iPhone Mockups/sw-06-money.png | {} |
| 10-visit-detail | iPhone Mockups/sw-10-visit-detail.png | {} |
| 14-lead-quote | iPhone Mockups/sw-14-lead-quote.png | {} |
| 16-quote-detail | iPhone Mockups/sw-16-quote-detail.png | {} |
| 19-checklist | iPhone Mockups/sw-19-checklist.png | {} |
| 22-photo-editor | iPhone Mockups/sw-22-photo-editor.png | {} |
| 23-signoff | iPhone Mockups/sw-23-signoff.png | {} |
| 25-invoice-detail | iPhone Mockups/sw-25-invoice-detail.png | {} |
| 36-day-map | iPhone Mockups/sw-36-day-map.png | {} |

Build: python3 build_timeline.py (needs vo/words.json from words.py) -> copy timeline.json + vo/*.wav + mockups into
remotion-composer/public/surewright-launch/{vo,mock}/ -> render composition SureWrightLaunch (props {"aspect":"16x9"} for wide).
