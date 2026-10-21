# Script + VO word timings -> timeline.json (line start times, caption words with script spelling).
import json, re
W = json.load(open("vo/words.json"))
LINES = [  # id, script text (the caption spells it this way), start (s)
    ("1", "You finished the job. So why are you still chasing the money?", 1.25),
    ("2", "SureWright is one app for small home-service businesses.", 4.65),
    ("3", "Your customer signs the quote once, and their card stays on file.", 7.8),
    ("4", "Run the whole day from your phone. Your stops. The map. The checklist. The photos.", 11.7),
    ("4b", "Found more work? Photograph it, and quote it before you leave.", 18.0),
    ("5", "Tap done, and the visit pays itself.", 21.5),
    ("5b", "And see who paid, and who still owes, in one place.", 24.0),
    ("6", "SureWright. Tap done. You're paid.", 28.1),
    ("7", "Save your spot in the beta, at surewright.app", 30.9),
]
TOTAL = 33.9
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
out = []
for lid, text, t0 in LINES:
    ww = W[f"L{lid}"]
    # Map each script word onto the whisper timeline by its share of the line's letters.
    wl = [(norm(x["w"]), x["s"], x["e"]) for x in ww]
    total_w = sum(len(a) for a, _, _ in wl) or 1
    def at(frac):  # letter fraction -> time
        acc = 0
        for a, s, e in wl:
            n = len(a) / total_w
            if acc + n >= frac - 1e-9:
                return s + (e - s) * ((frac - acc) / n if n else 0)
            acc += n
        return wl[-1][2]
    sw = text.split()
    total_s = sum(len(norm(x)) for x in sw) or 1
    acc, words = 0, []
    for x in sw:
        n = len(norm(x)) / total_s
        words.append({"w": x, "s": round(t0 + at(acc), 3), "e": round(t0 + at(acc + n), 3)})
        acc += n
    dur = ww[-1]["e"] if ww else 0
    out.append({"id": lid, "text": text, "t0": t0, "t1": round(t0 + dur, 3), "src": f"surewright-launch/vo/L{lid}.wav", "words": words})
json.dump({"total": TOTAL, "lines": out}, open("timeline.json", "w"), indent=1)
for L in out: print(L["id"], L["t0"], L["t1"])
