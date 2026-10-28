"use client";

import { useEffect, useId, useRef, useState } from "react";
import { PRODUCT_DOCUMENT_KIND_LABELS } from "../../../lib/api/types";
import type { ProductDocumentView, ProductVideoView } from "../../../lib/api/types";
import { IconChevronLeft, IconChevronRight, IconFileText, IconMinus, IconPlay, IconPlus, IconX } from "../../icons";
import { VIEWER_TAB_LABELS } from "./media-types";
import type { GalleryImage, ViewerRequest, ViewerTab } from "./media-types";
import { describeDuration, formatDuration, formatFileSize } from "./product-format";

const ZOOM_LEVELS = [1, 1.5, 2, 3];
const DOUBLE_TAP_ZOOM_LEVEL = 2;
const SWIPE_THRESHOLD_PX = 48;
const TAP_SLOP_PX = 10;
const DOUBLE_TAP_MS = 300;
const TAB_ORDER: ViewerTab[] = ["videos", "images", "documents"];

interface ZoomFocus {
  x: number;
  y: number;
}

interface TapRecord {
  time: number;
  x: number;
  y: number;
}

interface MediaViewerDialogProps {
  productName: string;
  images: GalleryImage[];
  videos: ProductVideoView[];
  documents: ProductDocumentView[];
  request: ViewerRequest;
  onClose: () => void;
}

function wrapIndex(index: number, length: number): number {
  if (length === 0) return 0;
  return ((index % length) + length) % length;
}

function videoTitle(video: ProductVideoView, index: number, productName: string): string {
  return video.title ?? `Video ${index + 1} de ${productName}`;
}

export function MediaViewerDialog({
  productName,
  images,
  videos,
  documents,
  request,
  onClose
}: MediaViewerDialogProps): React.ReactNode {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const tabRefs = useRef<Partial<Record<ViewerTab, HTMLButtonElement | null>>>({});
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const lastTap = useRef<TapRecord | null>(null);
  const pointerType = useRef<string>("mouse");
  const zoomFocus = useRef<ZoomFocus | null>(null);
  const imageAreaRef = useRef<HTMLDivElement | null>(null);
  const baseId = useId();
  const titleId = `${baseId}-titulo`;
  const panelId = `${baseId}-panel`;

  const counts: Record<ViewerTab, number> = { videos: videos.length, images: images.length, documents: documents.length };
  const tabs = TAB_ORDER.filter((candidate) => counts[candidate] > 0);
  const initialTab = tabs.includes(request.tab) ? request.tab : (tabs[0] ?? "images");

  const [tab, setTab] = useState<ViewerTab>(initialTab);
  const [imageIndex, setImageIndex] = useState(request.tab === "images" ? wrapIndex(request.index, images.length) : 0);
  const [videoIndex, setVideoIndex] = useState(request.tab === "videos" ? wrapIndex(request.index, videos.length) : 0);
  const [zoomLevel, setZoomLevel] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const focus = zoomFocus.current;
    const area = imageAreaRef.current;
    if (!focus || !area || zoomLevel === 0) return;
    zoomFocus.current = null;
    area.scrollTo({
      left: Math.max(0, focus.x * area.scrollWidth - area.clientWidth / 2),
      top: Math.max(0, focus.y * area.scrollHeight - area.clientHeight / 2)
    });
  }, [zoomLevel]);

  function closeDialog(): void {
    dialogRef.current?.close();
  }

  function selectTab(next: ViewerTab): void {
    setTab(next);
    setZoomLevel(0);
  }

  function step(delta: number): void {
    if (tab === "images") {
      setImageIndex((current) => wrapIndex(current + delta, images.length));
      setZoomLevel(0);
      return;
    }
    if (tab === "videos") setVideoIndex((current) => wrapIndex(current + delta, videos.length));
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>): void {
    const currentIndex = tabs.indexOf(tab);
    const targets: Record<string, number> = {
      ArrowRight: currentIndex + 1,
      ArrowLeft: currentIndex - 1,
      Home: 0,
      End: tabs.length - 1
    };
    const target = targets[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const next = tabs[wrapIndex(target, tabs.length)];
    if (!next) return;
    selectTab(next);
    tabRefs.current[next]?.focus();
  }

  function handleDialogKeyDown(event: React.KeyboardEvent<HTMLDialogElement>): void {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (tab === "documents") return;
    const target = event.target;
    if (target instanceof HTMLElement && target.closest("[role='tablist'], video, input, select, textarea")) return;
    event.preventDefault();
    step(event.key === "ArrowRight" ? 1 : -1);
  }

  function toggleZoomAt(area: HTMLDivElement, clientX: number, clientY: number): void {
    if (zoomLevel > 0) {
      setZoomLevel(0);
      return;
    }
    const bounds = area.getBoundingClientRect();
    zoomFocus.current = {
      x: Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width)),
      y: Math.min(1, Math.max(0, (clientY - bounds.top) / bounds.height))
    };
    setZoomLevel(DOUBLE_TAP_ZOOM_LEVEL);
  }

  function registerTap(event: React.PointerEvent<HTMLDivElement>): void {
    const previous = lastTap.current;
    const current: TapRecord = { time: event.timeStamp, x: event.clientX, y: event.clientY };
    lastTap.current = current;
    if (!previous || current.time - previous.time > DOUBLE_TAP_MS) return;
    if (Math.abs(current.x - previous.x) > SWIPE_THRESHOLD_PX || Math.abs(current.y - previous.y) > SWIPE_THRESHOLD_PX) return;
    lastTap.current = null;
    toggleZoomAt(event.currentTarget, event.clientX, event.clientY);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>): void {
    pointerType.current = event.pointerType;
    if (event.pointerType === "mouse") return;
    if (!event.isPrimary) {
      swipeStart.current = null;
      lastTap.current = null;
      return;
    }
    swipeStart.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>): void {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || !event.isPrimary) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) <= TAP_SLOP_PX && Math.abs(deltaY) <= TAP_SLOP_PX) {
      registerTap(event);
      return;
    }
    if (zoomLevel > 0) return;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaX) < Math.abs(deltaY)) return;
    step(deltaX < 0 ? 1 : -1);
  }

  function handleDoubleClick(event: React.MouseEvent<HTMLDivElement>): void {
    if (pointerType.current !== "mouse") return;
    toggleZoomAt(event.currentTarget, event.clientX, event.clientY);
  }

  const image = images[imageIndex];
  const video = videos[videoIndex];
  const zoom = ZOOM_LEVELS[zoomLevel] ?? 1;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onKeyDown={handleDialogKeyDown}
      className="m-0 h-dvh max-h-none w-full max-w-none border-0 bg-white p-0 text-ink backdrop:bg-navy-900/60"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2 sm:px-5">
          <div role="tablist" aria-label="Tipo de contenido" className="flex min-w-0 flex-1 flex-wrap gap-x-1">
            {tabs.map((candidate) => {
              const selected = candidate === tab;
              return (
                <button
                  key={candidate}
                  ref={(element) => {
                    tabRefs.current[candidate] = element;
                  }}
                  id={`${baseId}-pestana-${candidate}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={panelId}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectTab(candidate)}
                  onKeyDown={handleTabKeyDown}
                  className={`shrink-0 border-b-2 px-2 py-2.5 text-sm font-bold uppercase tracking-wide transition focus-visible:outline-offset-[-2px] sm:px-3 ${
                    selected ? "border-brand-600 text-brand-800" : "border-transparent text-slate-600 hover:text-ink"
                  }`}
                >
                  {VIEWER_TAB_LABELS[candidate]}
                  <span className="ml-1.5 font-semibold text-slate-600">({counts[candidate]})</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={closeDialog}
            aria-label="Cerrar vista completa"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-soft hover:text-ink"
          >
            <IconX size={22} />
          </button>
        </div>

        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={`${baseId}-pestana-${tab}`}
          className="flex min-h-0 flex-1 flex-col lg:flex-row"
        >
          <div className="relative flex min-h-0 flex-1 flex-col bg-white">
            {tab === "images" && image && (
              <>
                <div
                  ref={imageAreaRef}
                  className={`relative min-h-0 flex-1 overflow-auto ${zoomLevel === 0 ? "cursor-zoom-in touch-pan-y touch-pinch-zoom" : "cursor-zoom-out touch-manipulation"}`}
                  onPointerDown={handlePointerDown}
                  onPointerUp={handlePointerUp}
                  onDoubleClick={handleDoubleClick}
                  onPointerCancel={() => {
                    swipeStart.current = null;
                  }}
                >
                  <img
                    src={image.url}
                    alt={image.alt ?? productName}
                    draggable={false}
                    className={zoomLevel === 0 ? "absolute inset-0 h-full w-full select-none object-contain p-4 sm:p-8" : "m-auto block h-auto max-w-none select-none"}
                    style={zoomLevel === 0 ? undefined : { width: `${zoom * 100}%` }}
                  />
                </div>
                <p className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm" aria-live="polite">
                  Imagen {imageIndex + 1} de {images.length}
                </p>
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => step(-1)}
                      aria-label="Imagen anterior"
                      className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/95 text-ink shadow-md transition hover:bg-soft"
                    >
                      <IconChevronLeft size={22} />
                    </button>
                    <button
                      type="button"
                      onClick={() => step(1)}
                      aria-label="Imagen siguiente"
                      className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/95 text-ink shadow-md transition hover:bg-soft"
                    >
                      <IconChevronRight size={22} />
                    </button>
                  </>
                )}
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-line bg-white/95 p-1 shadow-md">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((current) => Math.max(0, current - 1))}
                    disabled={zoomLevel === 0}
                    aria-label="Alejar"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition hover:bg-soft disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <IconMinus size={18} />
                  </button>
                  <span className="min-w-14 text-center text-xs font-semibold text-slate-700" aria-live="polite">
                    {Math.round(zoom * 100)} %
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((current) => Math.min(ZOOM_LEVELS.length - 1, current + 1))}
                    disabled={zoomLevel === ZOOM_LEVELS.length - 1}
                    aria-label="Acercar"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition hover:bg-soft disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <IconPlus size={18} />
                  </button>
                </div>
              </>
            )}

            {tab === "videos" && video && (
              <div className="flex min-h-0 flex-1 items-center justify-center bg-navy-900 p-2 sm:p-6">
                <video
                  key={video.id}
                  controls
                  preload="metadata"
                  playsInline
                  poster={video.posterUrl ?? undefined}
                  aria-label={videoTitle(video, videoIndex, productName)}
                  className="h-full w-full rounded-lg object-contain"
                >
                  <source src={video.url} type="video/mp4" />
                  Tu navegador no puede reproducir este video.
                </video>
              </div>
            )}

            {tab === "documents" && (
              <div className="relative min-h-0 flex-1 overflow-y-auto bg-surface p-4 sm:p-8">
                <ul className="mx-auto grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
                  {documents.map((pdf) => {
                    const size = formatFileSize(pdf.sizeBytes);
                    return (
                      <li key={pdf.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-line bg-white p-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700">
                          <IconFileText size={22} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-ink">{pdf.title}</span>
                          <span className="block text-xs text-slate-600">
                            {PRODUCT_DOCUMENT_KIND_LABELS[pdf.kind]} · PDF{size ? ` · ${size}` : ""}
                          </span>
                        </span>
                        <a
                          href={pdf.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 rounded-lg border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
                        >
                          Ver PDF
                          <span className="sr-only">: {pdf.title} (se abre en una pestaña nueva)</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 text-center text-xs text-slate-600">Los documentos se abren en una pestaña nueva del navegador.</p>
              </div>
            )}
          </div>

          <div className="relative max-h-[38%] shrink-0 overflow-y-auto border-t border-line p-4 lg:max-h-none lg:w-80 lg:border-l lg:border-t-0 xl:w-96">
            <h2 id={titleId} className="line-clamp-3 text-base font-semibold leading-snug text-ink">
              {productName}
            </h2>

            {tab === "images" && (
              <ul className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-4" aria-label="Imágenes del producto">
                {images.map((candidate, index) => {
                  const active = index === imageIndex;
                  return (
                    <li key={`${candidate.url}-${index}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setImageIndex(index);
                          setZoomLevel(0);
                        }}
                        aria-label={`Imagen ${index + 1} de ${images.length}`}
                        aria-current={active ? "true" : undefined}
                        className={`block aspect-square w-full overflow-hidden rounded-lg border bg-white p-1 transition ${
                          active ? "border-brand-600 ring-2 ring-brand-200" : "border-line hover:border-brand-300"
                        }`}
                      >
                        <img src={candidate.url} alt="" loading="lazy" className="h-full w-full object-contain" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {tab === "videos" && (
              <>
                <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-600">Videos de este producto</p>
                <ul className="mt-2 space-y-2">
                  {videos.map((candidate, index) => {
                    const active = index === videoIndex;
                    const duration = formatDuration(candidate.durationSeconds);
                    const spokenDuration = describeDuration(candidate.durationSeconds);
                    return (
                      <li key={candidate.id}>
                        <button
                          type="button"
                          onClick={() => setVideoIndex(index)}
                          aria-current={active ? "true" : undefined}
                          className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition ${
                            active ? "border-brand-600 bg-brand-50" : "border-line hover:border-brand-300"
                          }`}
                        >
                          <span className="relative flex aspect-video w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-navy-900 text-white">
                            {candidate.posterUrl && <img src={candidate.posterUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-80" />}
                            <IconPlay size={20} fill="currentColor" className="relative" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="line-clamp-2 block text-sm font-semibold text-ink">{videoTitle(candidate, index, productName)}</span>
                            {duration && (
                              <span className="block text-xs text-slate-600">
                                <span aria-hidden="true">{duration}</span>
                                <span className="sr-only">Duración: {spokenDuration}</span>
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {tab === "documents" && (
              <p className="mt-3 text-sm text-slate-600">
                {documents.length === 1 ? "1 documento disponible" : `${documents.length} documentos disponibles`} en formato PDF.
              </p>
            )}
          </div>
        </div>
      </div>
    </dialog>
  );
}
