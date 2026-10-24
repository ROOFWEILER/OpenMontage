"""Synthesize the style-pack sound effects into remotion-composer/public/sfx/.

Every sound is generated from sine waves and seeded noise by this script, so it
is our own work (released CC0, see public/sfx/LICENSE.md): no download, no
attribution, the same bytes on every run.

    uv run --with numpy python remotion-composer/scripts/make_sfx.py
"""
import math
import pathlib
import wave

import numpy as np

SR = 48000
OUT = pathlib.Path(__file__).resolve().parents[1] / "public/sfx"
rng = np.random.default_rng(7)


def t_axis(sec):
    return np.arange(int(SR * sec)) / SR


def bandpass(x, centers, q):
    """RBJ band-pass with a per-sample centre frequency (a sweep)."""
    y = np.zeros_like(x)
    x1 = x2 = y1 = y2 = 0.0
    for n in range(len(x)):
        w = 2 * math.pi * centers[n] / SR
        alpha = math.sin(w) / (2 * q)
        a0 = 1 + alpha
        b0, b2 = alpha / a0, -alpha / a0
        a1, a2 = -2 * math.cos(w) / a0, (1 - alpha) / a0
        y[n] = b0 * x[n] + b2 * x2 - a1 * y1 - a2 * y2
        x2, x1, y2, y1 = x1, x[n], y1, y[n]
    return y


def lowpass(x, cutoffs):
    """One-pole low-pass with a per-sample cutoff."""
    y = np.zeros_like(x)
    prev = 0.0
    for n in range(len(x)):
        a = 1 - math.exp(-2 * math.pi * cutoffs[n] / SR)
        prev += a * (x[n] - prev)
        y[n] = prev
    return y


def fade(x, ms=4):
    k = int(SR * ms / 1000)
    x[:k] *= np.linspace(0, 1, k)
    x[-k:] *= np.linspace(1, 0, k)
    return x


def write(name, x):
    """Peak-normalise to -3 dBFS and write 16-bit WAV (mono or stereo)."""
    x = x / np.max(np.abs(x)) * 10 ** (-3 / 20)
    frames = (x * 32767).astype("<i2")
    with wave.open(str(OUT / name), "wb") as f:
        f.setnchannels(1 if x.ndim == 1 else 2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(frames.tobytes())


def tick():
    """Soft UI tick: a short damped click with a little wood in it."""
    t = t_axis(0.06)
    body = np.sin(2 * math.pi * 1500 * t) * np.exp(-t / 0.006)
    top = 0.35 * np.sin(2 * math.pi * 3100 * t) * np.exp(-t / 0.002)
    click = lowpass(rng.standard_normal(len(t)), np.full(len(t), 5000.0)) * np.exp(-t / 0.0015) * 0.6
    return fade(body + top + click, 2)


def pop():
    """Notification pop: a rounded upward blip, then a quiet second partial."""
    t = t_axis(0.16)
    f = 520 + 520 * (1 - np.exp(-t / 0.012))
    phase = 2 * math.pi * np.cumsum(f) / SR
    env = (1 - np.exp(-t / 0.002)) * np.exp(-t / 0.045)
    x = np.sin(phase) * env + 0.25 * np.sin(2 * phase) * env * np.exp(-t / 0.02)
    return fade(x, 3)


def whoosh():
    """Air rush that peaks 0.25 s in (the zoom_through peak), panned L to R."""
    t = t_axis(0.6)
    peak = 0.25
    shape = np.where(t < peak, (t / peak) ** 2.2, np.exp(-(t - peak) / 0.09))
    centers = 350 + 2200 * shape
    x = bandpass(rng.standard_normal(len(t)), centers, 1.1) * shape
    pan = np.clip(t / 0.5, 0, 1)
    return np.stack([fade(x * np.cos(pan * math.pi / 2), 6), fade(x * np.sin(pan * math.pi / 2), 6)], axis=1)


def swell():
    """Subtle rising swell for a chart growing: a soft pad that opens up, ~1.3 s."""
    t = t_axis(1.3)
    env = np.clip(t / 1.05, 0, 1) ** 1.8 * np.where(t > 1.05, np.exp(-(t - 1.05) / 0.07), 1)
    pad = sum(np.sin(2 * math.pi * f * t + p) for f, p in [(196, 0), (196.8, 1), (247, 2), (294, 3), (392, 4)])
    air = rng.standard_normal(len(t)) * 0.5
    x = lowpass(pad + air, 400 + 3200 * env) * env
    return fade(x, 8)


def slam():
    """Light card slam: a short low thump with a paper slap on top."""
    t = t_axis(0.3)
    f = 50 + 70 * np.exp(-t / 0.03)
    thump = np.sin(2 * math.pi * np.cumsum(f) / SR) * np.exp(-t / 0.07)
    slap = lowpass(rng.standard_normal(len(t)), np.full(len(t), 2500.0)) * np.exp(-t / 0.012) * 1.4
    return fade(thump + slap, 2)


def sting():
    """Logo end card sting (2.5 s, the card's length): a short air lift into a warm open
    chord that blooms and then decays slowly to the end, so the card is never silent."""
    t = t_axis(2.5)
    lift = bandpass(rng.standard_normal(len(t)), 500 + 1800 * np.clip(t / 0.22, 0, 1), 1.2) * np.clip(t / 0.22, 0, 1) ** 2 * np.exp(-np.clip(t - 0.22, 0, None) / 0.08) * 0.5
    chord = [(98, 0.55), (147, 0.5), (196, 0.6), (247, 0.4), (294, 0.35), (392, 0.22), (588, 0.1)]
    pad = sum(a * (np.sin(2 * math.pi * f * t + i) + 0.4 * np.sin(2 * math.pi * f * 1.003 * t + 2 * i)) for i, (f, a) in enumerate(chord))
    attack = 1 - np.exp(-np.clip(t - 0.12, 0, None) / 0.07)
    env = attack * np.exp(-np.clip(t - 0.35, 0, None) / 0.95)  # ~ -20 dB by the end, never silent
    x = lowpass(pad, 900 + 2600 * np.exp(-t / 0.8)) * env + lift
    x[-int(SR * 0.12):] *= np.linspace(1, 0, int(SR * 0.12))  # soft out, no click at the cut
    return fade(x, 6)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in [("tick", tick), ("pop", pop), ("whoosh", whoosh), ("swell", swell), ("slam", slam), ("sting", sting)]:  # sting LAST: the shared rng keeps the older bytes identical
        write(f"{name}.wav", fn())
        print("wrote", OUT / f"{name}.wav")
