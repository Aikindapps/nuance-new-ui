// AvatarCropper — net-new in-house canvas circular cropper (NIC-273).
// No external dep: react-avatar-editor is not React-19 compatible.
// Renders a display-only circular mask over a draggable/zoomable image.
// Output: 400×400 square JPEG (circles have no alpha; white background).

import { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import {
  primaryButtonSx,
  secondaryButtonSx,
} from "../../components/ui/modalButtons";
import { registerModalCopy } from "../../constants/copy";

export const AVATAR_CROP_TITLE_ID = "avatar-crop-title";

const FRAME = 300;    // display crop-square side in CSS px
const OUTPUT = 400;   // exported JPEG side in px
const MAX_ZOOM = 3;   // max multiple of the cover-fit scale

type Offset = { x: number; y: number };

function clampOffset(
  o: Offset,
  scale: number,
  natW: number,
  natH: number,
): Offset {
  const dw = natW * scale;
  const dh = natH * scale;
  const minX = FRAME - dw; // <= 0
  const minY = FRAME - dh;
  return {
    x: Math.min(0, Math.max(minX, o.x)),
    y: Math.min(0, Math.max(minY, o.y)),
  };
}

export type AvatarCropperProps = {
  file: File;
  onSave: (file: File) => void;
  onCancel: () => void;
};

export function AvatarCropper({ file, onSave, onCancel }: AvatarCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const minScaleRef = useRef<number>(1);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const [imgReady, setImgReady] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });

  // Load image from file — setState calls are in the img.onload callback,
  // NOT directly in the effect body, so react-hooks/set-state-in-effect is
  // not triggered.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const minScale = FRAME / Math.min(img.naturalWidth, img.naturalHeight);
      minScaleRef.current = minScale;
      const dw = img.naturalWidth * minScale;
      const dh = img.naturalHeight * minScale;
      setOffset({ x: (FRAME - dw) / 2, y: (FRAME - dh) / 2 });
      setZoom(1);
      setImgReady(true);
    };
    img.onerror = () => onCancel();
    img.src = url;
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, onCancel]);

  // Draw the crop frame whenever image, zoom, or offset change.
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = FRAME * dpr;
    canvas.height = FRAME * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, FRAME, FRAME);

    const scale = minScaleRef.current * zoom;
    ctx.drawImage(
      img,
      offset.x,
      offset.y,
      img.naturalWidth * scale,
      img.naturalHeight * scale,
    );

    // Dim mask with a circular hole (even-odd rule): rect then reverse arc.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, FRAME, FRAME);
    ctx.arc(FRAME / 2, FRAME / 2, FRAME / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = "rgba(32,33,35,0.55)";
    ctx.fill("evenodd");
    ctx.restore();

    // Crop-circle ring.
    ctx.beginPath();
    ctx.arc(FRAME / 2, FRAME / 2, FRAME / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [imgReady, zoom, offset]);

  // Escape key cancels.
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  // Pointer drag handlers.
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    canvasRef.current?.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    const img = imgRef.current;
    if (!img) return;
    const scale = minScaleRef.current * zoom;
    setOffset((o) =>
      clampOffset(
        { x: o.x + dx, y: o.y + dy },
        scale,
        img.naturalWidth,
        img.naturalHeight,
      ),
    );
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  // Zoom slider — keeps the center point stable.
  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nz = Number(e.target.value);
    const img = imgRef.current;
    setZoom(nz);
    if (img) {
      const oldScale = minScaleRef.current * zoom;
      const newScale = minScaleRef.current * nz;
      setOffset((o) => {
        const cx = FRAME / 2;
        const cy = FRAME / 2;
        const ix = (cx - o.x) / oldScale;
        const iy = (cy - o.y) / oldScale;
        return clampOffset(
          { x: cx - ix * newScale, y: cy - iy * newScale },
          newScale,
          img.naturalWidth,
          img.naturalHeight,
        );
      });
    }
  };

  // Export the cropped region as a 400×400 JPEG.
  const handleSave = () => {
    const img = imgRef.current;
    if (!img) return;
    const out = document.createElement("canvas");
    out.width = OUTPUT;
    out.height = OUTPUT;
    const octx = out.getContext("2d");
    if (!octx) return;
    octx.fillStyle = "#ffffff";
    octx.fillRect(0, 0, OUTPUT, OUTPUT);
    const k = OUTPUT / FRAME;
    const scale = minScaleRef.current * zoom;
    octx.drawImage(
      img,
      offset.x * k,
      offset.y * k,
      img.naturalWidth * scale * k,
      img.naturalHeight * scale * k,
    );
    out.toBlob(
      (blob) => {
        if (!blob) return;
        onSave(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={AVATAR_CROP_TITLE_ID}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
    >
      <div className="flex w-[calc(420*var(--fpx))] max-w-[calc(100vw-32px)] flex-col rounded-modal bg-white px-6 py-8 md:px-10 md:py-10">
        <h2
          id={AVATAR_CROP_TITLE_ID}
          className="text-title-md font-bold text-ink"
        >
          {registerModalCopy.avatarCropTitle}
        </h2>
        <p className="mt-2 text-body text-ink-60">
          {registerModalCopy.avatarCropInstructions}
        </p>

        {/* Crop canvas — rounded-full clips the square to a circle visually */}
        <div className="mt-6 flex justify-center">
          <canvas
            ref={canvasRef}
            aria-label={registerModalCopy.avatarCropCanvasLabel}
            style={{
              width: FRAME,
              height: FRAME,
              touchAction: "none",
              cursor: "move",
            }}
            className="rounded-full"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        </div>

        {/* Zoom slider */}
        <div className="mt-6 flex items-center gap-3">
          <span
            className="text-label font-medium text-ink"
            id="avatar-zoom-label"
          >
            {registerModalCopy.avatarCropZoomLabel}
          </span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={handleZoomChange}
            aria-labelledby="avatar-zoom-label"
            className="h-1 flex-1 cursor-pointer accent-brand-purple"
          />
        </div>

        {/* Footer buttons */}
        <div className="mt-8 flex items-center justify-end gap-2">
          <Button onClick={onCancel} sx={secondaryButtonSx}>
            {registerModalCopy.avatarCropCancelLabel}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!imgReady}
            sx={primaryButtonSx}
          >
            {registerModalCopy.avatarCropSaveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
