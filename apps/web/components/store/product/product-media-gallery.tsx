"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ProductDocumentView, ProductVideoView } from "../../../lib/api/types";
import { IconDroplets, IconFileText, IconPlay } from "../../icons";
import { WishlistButton } from "../wishlist-button";
import { MediaViewerDialog } from "./media-viewer-dialog";
import type { GalleryImage, ViewerRequest } from "./media-types";
import { useProductSelection } from "./product-selection-context";
import { ShareButton } from "./share-button";

const MAX_THUMBNAILS = 7;
const MAX_DOTS = 10;

type MediaTile =
  | { kind: "image"; key: string; image: GalleryImage; index: number }
  | { kind: "video"; key: string; video: ProductVideoView; index: number };

interface ProductMediaGalleryProps {
  productId: string;
  productName: string;
  images: GalleryImage[];
  videos: ProductVideoView[];
  documents: ProductDocumentView[];
}

function withVariantImage(images: GalleryImage[], variantImageUrl: string | null, label: string | null): GalleryImage[] {
  if (!variantImageUrl) return images;
  if (images.some((image) => image.url === variantImageUrl)) return images;
  return [{ url: variantImageUrl, alt: label }, ...images];
}

function buildTiles(images: GalleryImage[], videos: ProductVideoView[]): MediaTile[] {
  return [
    ...images.map((image, index): MediaTile => ({ kind: "image", key: `imagen-${index}-${image.url}`, image, index })),
    ...videos.map((video, index): MediaTile => ({ kind: "video", key: `video-${video.id}`, video, index }))
  ];
}

function tileRequest(tile: MediaTile): ViewerRequest {
  return { tab: tile.kind === "image" ? "images" : "videos", index: tile.index };
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function ProductMediaGallery({ productId, productName, images, videos, documents }: ProductMediaGalleryProps): React.ReactNode {
  const { variantImageUrl, selectedVariant } = useProductSelection();
  const variantLabel = selectedVariant ? `${productName} – ${selectedVariant.label}` : null;
  const galleryImages = useMemo(() => withVariantImage(images, variantImageUrl, variantLabel), [images, variantImageUrl, variantLabel]);
  const tiles = useMemo(() => buildTiles(galleryImages, videos), [galleryImages, videos]);

  const [trackedVariantImage, setTrackedVariantImage] = useState(variantImageUrl);
  const [activeUrl, setActiveUrl] = useState<string | null>(variantImageUrl);
  const [focusIndex, setFocusIndex] = useState(0);
  const [zoomOrigin, setZoomOrigin] = useState<string | null>(null);
  const [viewer, setViewer] = useState<ViewerRequest | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const trackRef = useRef<HTMLUListElement | null>(null);

  if (trackedVariantImage !== variantImageUrl) {
    setTrackedVariantImage(variantImageUrl);
    if (variantImageUrl) setActiveUrl(variantImageUrl);
  }

  const activeIndex = Math.max(0, galleryImages.findIndex((image) => image.url === activeUrl));
  const activeImage = galleryImages[activeIndex];
  const overflowing = tiles.length > MAX_THUMBNAILS;
  const visibleTiles = overflowing ? tiles.slice(0, MAX_THUMBNAILS - 1) : tiles;
  const firstHidden = overflowing ? tiles[visibleTiles.length] : undefined;
  const hiddenCount = tiles.length - visibleTiles.length;
  const thumbnailCount = visibleTiles.length + (firstHidden ? 1 : 0);
  const rovingIndex = Math.min(focusIndex, Math.max(0, thumbnailCount - 1));

  useEffect(() => {
    if (!variantImageUrl) return;
    const track = trackRef.current;
    if (!track) return;
    const index = galleryImages.findIndex((image) => image.url === variantImageUrl);
    if (index < 0) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "auto" });
  }, [galleryImages, variantImageUrl]);

  function openViewer(request: ViewerRequest): void {
    setZoomOrigin(null);
    setViewer(request);
  }

  function handleThumbnailKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number): void {
    const targets: Record<string, number> = {
      ArrowDown: index + 1,
      ArrowRight: index + 1,
      ArrowUp: index - 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: thumbnailCount - 1
    };
    const target = targets[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const next = Math.min(thumbnailCount - 1, Math.max(0, target));
    setFocusIndex(next);
    thumbnailRefs.current[next]?.focus();
  }

  function handleMainPointerMove(event: React.PointerEvent<HTMLButtonElement>): void {
    if (event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  }

  function handleTrackScroll(): void {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setSlideIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  const overlayButtons = (
    <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
      <WishlistButton productId={productId} productName={productName} />
      <ShareButton title={productName} />
    </div>
  );

  const placeholder = (
    <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-line bg-linear-to-b from-brand-50 to-white text-brand-200">
      <IconDroplets size={110} strokeWidth={1} />
    </div>
  );

  return (
    <div>
      <div className="md:hidden">
        {tiles.length === 0 ? (
          <div className="relative">
            {placeholder}
            {overlayButtons}
          </div>
        ) : (
          <>
            <div className="relative">
              <ul
                ref={trackRef}
                onScroll={handleTrackScroll}
                aria-label={`Imágenes y videos de ${productName}`}
                className="relative flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-xl border border-line bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {tiles.map((tile, position) => (
                  <li key={tile.key} className="w-full shrink-0 snap-center">
                    <button
                      type="button"
                      aria-haspopup="dialog"
                      onClick={() => openViewer(tileRequest(tile))}
                      aria-label={
                        tile.kind === "image"
                          ? `Abrir vista completa, imagen ${position + 1} de ${tiles.length}`
                          : `Reproducir video: ${tile.video.title ?? productName}`
                      }
                      className="relative block aspect-square w-full focus-visible:outline-offset-[-3px]"
                    >
                      {tile.kind === "image" && (
                        <img
                          src={tile.image.url}
                          alt={tile.image.alt ?? productName}
                          loading={position === 0 ? "eager" : "lazy"}
                          fetchPriority={position === 0 ? "high" : undefined}
                          className="h-full w-full object-contain p-3"
                        />
                      )}
                      {tile.kind === "video" && (
                        <span className="flex h-full w-full items-center justify-center bg-navy-900 text-white">
                          {tile.video.posterUrl && (
                            <img src={tile.video.posterUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                          )}
                          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-navy-900 shadow-lg">
                            <IconPlay size={28} fill="currentColor" />
                          </span>
                          <span className="absolute bottom-3 left-3 rounded bg-navy-900/85 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                            Video
                          </span>
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              {overlayButtons}
            </div>
            {tiles.length > 1 && (
              <div className="mt-2.5 flex items-center justify-center gap-1.5">
                {tiles.length <= MAX_DOTS ? (
                  tiles.map((tile, position) => (
                    <span
                      key={tile.key}
                      aria-hidden="true"
                      className={`h-1.5 rounded-full transition-all ${position === slideIndex ? "w-5 bg-brand-600" : "w-1.5 bg-slate-300"}`}
                    />
                  ))
                ) : (
                  <span aria-hidden="true" className="text-xs font-semibold text-slate-600">
                    {slideIndex + 1} / {tiles.length}
                  </span>
                )}
                <span className="sr-only" aria-live="polite">
                  Elemento {slideIndex + 1} de {tiles.length}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="hidden gap-3 md:flex">
        {thumbnailCount > 1 && (
          <ul className="flex w-14 shrink-0 flex-col gap-2" aria-label="Miniaturas del producto">
            {visibleTiles.map((tile, position) => {
              const active = tile.kind === "image" && tile.index === activeIndex;
              return (
                <li key={tile.key}>
                  <button
                    ref={(element) => {
                      thumbnailRefs.current[position] = element;
                    }}
                    type="button"
                    tabIndex={position === rovingIndex ? 0 : -1}
                    aria-current={active ? "true" : undefined}
                    aria-haspopup={tile.kind === "video" ? "dialog" : undefined}
                    aria-label={
                      tile.kind === "image"
                        ? `Imagen ${tile.index + 1} de ${galleryImages.length}${tile.image.alt ? `: ${tile.image.alt}` : ""}`
                        : `Video: ${tile.video.title ?? `video ${tile.index + 1}`}`
                    }
                    onMouseEnter={() => {
                      if (tile.kind === "image") setActiveUrl(tile.image.url);
                    }}
                    onFocus={() => {
                      setFocusIndex(position);
                      if (tile.kind === "image") setActiveUrl(tile.image.url);
                    }}
                    onClick={() => {
                      if (tile.kind === "video") {
                        openViewer(tileRequest(tile));
                        return;
                      }
                      setActiveUrl(tile.image.url);
                    }}
                    onKeyDown={(event) => handleThumbnailKeyDown(event, position)}
                    className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border bg-white p-1 transition ${
                      active ? "border-brand-600 ring-2 ring-brand-200" : "border-line hover:border-brand-400"
                    }`}
                  >
                    {tile.kind === "image" && (
                      <img src={tile.image.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-contain" />
                    )}
                    {tile.kind === "video" && (
                      <>
                        {tile.video.posterUrl ? (
                          <img src={tile.video.posterUrl} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                        ) : (
                          <span className="absolute inset-0 bg-navy-900" />
                        )}
                        <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-navy-900 shadow">
                          <IconPlay size={13} fill="currentColor" />
                        </span>
                      </>
                    )}
                  </button>
                </li>
              );
            })}
            {firstHidden && (
              <li>
                <button
                  ref={(element) => {
                    thumbnailRefs.current[visibleTiles.length] = element;
                  }}
                  type="button"
                  tabIndex={visibleTiles.length === rovingIndex ? 0 : -1}
                  aria-haspopup="dialog"
                  aria-label={`Ver ${hiddenCount} medios más`}
                  onFocus={() => setFocusIndex(visibleTiles.length)}
                  onClick={() => openViewer(tileRequest(firstHidden))}
                  onKeyDown={(event) => handleThumbnailKeyDown(event, visibleTiles.length)}
                  className="flex aspect-square w-full items-center justify-center rounded-lg border border-line bg-soft text-sm font-extrabold text-ink transition hover:border-brand-400"
                >
                  {hiddenCount}+
                </button>
              </li>
            )}
          </ul>
        )}

        <div className="min-w-0 flex-1">
          {activeImage ? (
            <div className="relative">
              <button
                type="button"
                aria-haspopup="dialog"
                aria-label={`Abrir vista completa: ${activeImage.alt ?? productName}`}
                onClick={() => openViewer({ tab: "images", index: activeIndex })}
                onPointerMove={handleMainPointerMove}
                onPointerLeave={() => setZoomOrigin(null)}
                className="relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-xl border border-line bg-white"
              >
                <img
                  src={activeImage.url}
                  alt={activeImage.alt ?? productName}
                  fetchPriority="high"
                  decoding="async"
                  className="h-full w-full object-contain p-3"
                  style={zoomOrigin ? { transform: "scale(2.2)", transformOrigin: zoomOrigin } : undefined}
                />
              </button>
              {overlayButtons}
            </div>
          ) : (
            <div className="relative">
              {placeholder}
              {overlayButtons}
            </div>
          )}
          {activeImage && (
            <p className="mt-2 text-center text-xs text-slate-600">
              Pasa el cursor sobre la imagen para ampliarla · Haz clic para ver la vista completa
            </p>
          )}
          {(videos.length > 0 || documents.length > 0) && (
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {videos.length > 0 && (
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => openViewer({ tab: "videos", index: 0 })}
                  className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-brand-800 transition hover:border-brand-400"
                >
                  <IconPlay size={13} fill="currentColor" />
                  {pluralize(videos.length, "video", "videos")}
                </button>
              )}
              {documents.length > 0 && (
                <button
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => openViewer({ tab: "documents", index: 0 })}
                  className="flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-brand-800 transition hover:border-brand-400"
                >
                  <IconFileText size={14} />
                  {pluralize(documents.length, "documento", "documentos")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {viewer && (
        <MediaViewerDialog
          productName={productName}
          images={galleryImages}
          videos={videos}
          documents={documents}
          request={viewer}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}
