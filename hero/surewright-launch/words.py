# Word timings per VO line (faster-whisper) -> vo/words.json, used for captions and QA.
import json, sys
from faster_whisper import WhisperModel
m = WhisperModel("small.en", compute_type="int8")
out = {}
for i in ["1","2","3","4","4b","5","5b","6","7"]:
    segs, _ = m.transcribe(f"vo/L{i}.wav", word_timestamps=True)
    out[f"L{i}"] = [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)} for s in segs for w in s.words]
    print(f"L{i}:", " ".join(x["w"] for x in out[f"L{i}"]))
json.dump(out, open("vo/words.json", "w"), indent=1)
