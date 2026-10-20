"""Background removal tool wrapping rembg.

Removes backgrounds from images using the rembg library (U2Net models).
Outputs transparent PNGs or composites onto a custom background color.
Supports local execution via rembg and optionally cloud APIs.

Video mode (input_path is .mp4/.mov/.webm/.mkv): every frame is matted with
one rembg session and the result is written as a VP9 WebM with an alpha
channel — the presenter matte that Remotion's TalkingHead
`foregroundMatteSrc` draws over "behind" overlays (text-behind-presenter).
The mask is computed at `mask_scale` of the frame size (faster) and applied
to the full-resolution frame. Local and free; ~0.1-0.4 s per frame on CPU.
"""

from __future__ import annotations

import json
import subprocess
import time
from pathlib import Path
from typing import Any

from tools.base_tool import (
    BaseTool,
    Determinism,
    ExecutionMode,
    ResourceProfile,
    ToolResult,
    ToolRuntime,
    ToolStability,
    ToolStatus,
    ToolTier,
)


VIDEO_SUFFIXES = {".mp4", ".mov", ".webm", ".mkv", ".m4v"}


class BgRemove(BaseTool):
    name = "bg_remove"
    version = "0.1.0"
    tier = ToolTier.ENHANCE
    capability = "enhancement"
    provider = "rembg"
    stability = ToolStability.EXPERIMENTAL
    execution_mode = ExecutionMode.SYNC
    determinism = Determinism.DETERMINISTIC
    runtime = ToolRuntime.HYBRID

    dependencies = ["python:rembg", "python:PIL"]
    install_instructions = (
        "pip install rembg       # CPU mode\n"
        "pip install rembg[gpu]  # GPU mode (requires CUDA + onnxruntime-gpu)"
    )
    agent_skills = ["ffmpeg"]

    capabilities = [
        "background_removal",
        "alpha_matte",
        "batch_processing",
        "custom_background",
    ]

    input_schema = {
        "type": "object",
        "required": ["input_path"],
        "properties": {
            "input_path": {
                "type": "string",
                "description": "Path to an image, or a video (.mp4/.mov/.webm/.mkv) for an alpha-matte WebM",
            },
            "output_path": {
                "type": "string",
                "description": "Output path; defaults to {stem}_nobg.png",
            },
            "model": {
                "type": "string",
                "enum": ["u2net", "u2net_human_seg", "isnet-general-use"],
                "default": "u2net",
            },
            "bg_color": {
                "type": "string",
                "description": "Replacement background color hex (e.g. #00FF00). Transparent if not set.",
            },
            "alpha_matting": {
                "type": "boolean",
                "default": False,
                "description": "Use alpha matting for finer edges",
            },
            "mask_scale": {
                "type": "number",
                "default": 0.5,
                "description": "Video mode: compute each mask at this fraction of the frame size",
            },
        },
    }

    resource_profile = ResourceProfile(
        cpu_cores=2, ram_mb=2048, vram_mb=0, disk_mb=500
    )

    idempotency_key_fields = ["input_path", "model", "bg_color", "alpha_matting", "mask_scale"]
    side_effects = ["writes background-removed image to output_path"]
    user_visible_verification = [
        "Inspect output for clean edges around the subject",
        "Verify transparency or background color is applied correctly",
    ]

    def get_status(self) -> ToolStatus:
        try:
            import rembg  # noqa: F401
            return ToolStatus.AVAILABLE
        except ImportError:
            return ToolStatus.UNAVAILABLE

    def execute(self, inputs: dict[str, Any]) -> ToolResult:
        input_path = Path(inputs["input_path"])
        if not input_path.exists():
            return ToolResult(success=False, error=f"Input not found: {input_path}")

        if input_path.suffix.lower() in VIDEO_SUFFIXES:
            return self._execute_video(input_path, inputs)

        output_path = Path(
            inputs.get("output_path", str(input_path.with_stem(f"{input_path.stem}_nobg").with_suffix(".png")))
        )
        model_name = inputs.get("model", "u2net")
        bg_color = inputs.get("bg_color")
        alpha_matting = inputs.get("alpha_matting", False)

        try:
            import rembg
        except ImportError:
            return ToolResult(
                success=False,
                error="rembg is not installed. Run: pip install rembg",
            )

        try:
            from PIL import Image
        except ImportError:
            return ToolResult(
                success=False,
                error="Pillow is not installed. Run: pip install Pillow",
            )

        start = time.time()

        input_image = Image.open(input_path)

        result_image = rembg.remove(
            input_image,
            session=rembg.new_session(model_name),
            alpha_matting=alpha_matting,
        )

        # Composite onto a colored background if requested
        if bg_color:
            hex_color = bg_color.lstrip("#")
            r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
            background = Image.new("RGBA", result_image.size, (r, g, b, 255))
            background.paste(result_image, mask=result_image.split()[3])
            result_image = background.convert("RGB")

        output_path.parent.mkdir(parents=True, exist_ok=True)
        result_image.save(str(output_path))

        elapsed = time.time() - start

        return ToolResult(
            success=True,
            data={
                "input": str(input_path),
                "output": str(output_path),
                "model": model_name,
                "alpha_matting": alpha_matting,
                "bg_color": bg_color,
            },
            artifacts=[str(output_path)],
            duration_seconds=round(elapsed, 2),
        )

    def _execute_video(self, input_path: Path, inputs: dict[str, Any]) -> ToolResult:
        """Matte every frame; write a VP9/yuva420p WebM (alpha) at the source fps."""
        try:
            import numpy as np
            import rembg
            from PIL import Image
        except ImportError as e:
            return ToolResult(success=False, error=f"{e.name} is not installed. Run: pip install rembg")

        output_path = Path(inputs.get("output_path") or input_path.with_name(f"{input_path.stem}_matte.webm"))
        if output_path.suffix.lower() != ".webm":
            return ToolResult(success=False, error="Video mode writes an alpha WebM: output_path must end in .webm")
        model_name = inputs.get("model", "u2net_human_seg")
        scale = float(inputs.get("mask_scale", 0.5))

        probe = subprocess.run(
            ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
             "stream=width,height,r_frame_rate", "-of", "json", str(input_path)],
            capture_output=True, text=True,
        )
        try:
            st = json.loads(probe.stdout)["streams"][0]
            w, h, fps = int(st["width"]), int(st["height"]), st["r_frame_rate"]
        except (KeyError, IndexError, ValueError):
            return ToolResult(success=False, error=f"ffprobe could not read {input_path}: {probe.stderr[-300:]}")

        start = time.time()
        session = rembg.new_session(model_name)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        dec = subprocess.Popen(
            ["ffmpeg", "-v", "error", "-i", str(input_path), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
            stdout=subprocess.PIPE,
        )
        enc = subprocess.Popen(
            ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{w}x{h}", "-r", fps,
             "-i", "-", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "30",
             "-row-mt", "1", "-deadline", "realtime", "-cpu-used", "5", "-auto-alt-ref", "0", str(output_path)],
            stdin=subprocess.PIPE,
        )
        frames, size = 0, w * h * 3
        small = (max(1, int(w * scale)), max(1, int(h * scale)))
        try:
            while True:
                buf = dec.stdout.read(size)
                if len(buf) < size:
                    break
                frame = Image.frombytes("RGB", (w, h), buf)
                mask = rembg.remove(frame.resize(small, Image.BILINEAR), session=session, only_mask=True)
                mask = mask.convert("L").resize((w, h), Image.BILINEAR)
                rgba = np.dstack([np.asarray(frame), np.asarray(mask)])
                enc.stdin.write(rgba.tobytes())
                frames += 1
        finally:
            enc.stdin.close()
            enc.wait()
            dec.wait()
        if frames == 0 or enc.returncode != 0:
            return ToolResult(success=False, error=f"matte encode failed (frames={frames}, ffmpeg exit={enc.returncode})")

        return ToolResult(
            success=True,
            data={"input": str(input_path), "output": str(output_path), "model": model_name,
                  "frames": frames, "fps": fps, "mask_scale": scale, "format": "webm/vp9 yuva420p"},
            artifacts=[str(output_path)],
            duration_seconds=round(time.time() - start, 2),
        )
