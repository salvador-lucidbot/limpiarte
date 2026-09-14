"use client";

import { useState } from "react";
import { IconDroplets } from "../icons";

interface GalleryImage {
  url: string;
  alt: string | null;
}

export function ProductGallery({ images, productName }: { images: GalleryImage[]; productName: string }): React.ReactNode {
  const [selected, setSelected] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  const current = images[selected] ?? images[0];

  if (!current) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-b from-brand-50 to-slate-50 text-brand-200">
        <IconDroplets size={110} strokeWidth={1} />
      </div>
    );
  }

  function onMouseMove(event: React.MouseEvent<HTMLDivElement>): void {
    const bounds = event.currentTarget.getBoundingClientRect();
    setZoom({
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100
    });
  }

  return (
    <div>
      <div
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200 bg-white"
        onMouseMove={onMouseMove}
        onMouseLeave={() => setZoom(null)}
      >
        <img
          src={current.url}
          alt={current.alt ?? productName}
          className="h-full w-full object-cover transition-transform duration-150"
          style={
            zoom
              ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
              : undefined
          }
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.slice(0, 5).map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Ver imagen ${index + 1} de ${productName}`}
              className={`aspect-square overflow-hidden rounded-lg border-2 transition ${
                index === selected ? "border-brand-500" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <img src={image.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
