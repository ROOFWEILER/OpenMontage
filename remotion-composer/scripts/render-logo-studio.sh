#!/usr/bin/env bash
# Pre-render the logo studio for every brand: intro + end card, per aspect.
#
#   scripts/render-logo-studio.sh [OUT_DIR] [brand ...]
#
# OUT_DIR default: ~/.claude/brands — files land in <OUT_DIR>/<brand>/assets/logo-studio/:
#   intro-<aspect>.mp4     opaque, brand background, H.264 (any tool)
#   endcard-<aspect>.mp4   opaque, 48 kHz stereo AAC: the end card sting (public/sfx/sting.wav + whoosh/pop,
#                          mixed in the composition) — never a silent card (2026-10-24)
#   intro-9x16.webm        transparent (VP9 alpha) — overlay the intro on footage
#   endcard-9x16.webm      transparent (VP9 alpha, Opus sting) — overlay the card on the last shot
# ASPECTS env: default "9x16 1x1 16x9". Deterministic, free, no network.
set -euo pipefail
cd "$(dirname "$0")/.."

OUT="${1:-$HOME/.claude/brands}"
shift || true
BRANDS=("$@")
if [ ${#BRANDS[@]} -eq 0 ]; then BRANDS=(roofweiler proofwright tepui-construction tepui-management turnkey-crews); fi
ASPECTS="${ASPECTS:-9x16 1x1 16x9}"

BUNDLE="$(mktemp -d)/bundle"
npx remotion bundle src/index.tsx --out-dir "$BUNDLE" --log=error >/dev/null

render() { # id brand aspect transparent out
  local id=$1 brand=$2 aspect=$3 transparent=$4 out=$5
  local props="{\"brand\":\"$brand\",\"aspect\":\"$aspect\",\"transparent\":$transparent}"
  if [ "$transparent" = true ]; then
    npx remotion render "$BUNDLE" "$id" "$out" --props="$props" --codec=vp9 --pixel-format=yuva420p --image-format=png --log=error
  else
    npx remotion render "$BUNDLE" "$id" "$out" --props="$props" --codec=h264 --crf=16 --log=error
  fi
}

for brand in "${BRANDS[@]}"; do
  dir="$OUT/$brand/assets/logo-studio"
  mkdir -p "$dir"
  for aspect in $ASPECTS; do
    render LogoIntro "$brand" "$aspect" false "$dir/intro-$aspect.mp4"
    tmp="$dir/.endcard-$aspect.mp4"
    render LogoEndCard "$brand" "$aspect" false "$tmp"
    # The composition carries the sting; normalise it to 48 kHz stereo AAC, padded to the card's
    # exact length, so it concatenates with a voiced reel without remapping.
    ffmpeg -v error -y -i "$tmp" -map 0:v -map 0:a -c:v copy -af "aresample=48000,aformat=channel_layouts=stereo,apad" -c:a aac -b:a 192k -shortest "$dir/endcard-$aspect.mp4"
    rm -f "$tmp"
  done
  render LogoIntro "$brand" 9x16 true "$dir/intro-9x16.webm"
  render LogoEndCard "$brand" 9x16 true "$dir/endcard-9x16.webm"
  echo "LOGO_STUDIO_RENDERED $brand -> $dir"
done
