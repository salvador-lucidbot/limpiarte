"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconChevronLeft, IconChevronRight } from "../../icons";
import { prefersReducedMotion } from "./media-types";
import { PRODUCT_SECTION_CLASS, PRODUCT_SECTION_TITLE_CLASS } from "./section-styles";

const EDGE_TOLERANCE_PX = 4;

interface PagerState {
  page: number;
  total: number;
  atStart: boolean;
  atEnd: boolean;
}

interface ProductCarouselProps {
  headingId: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

const INITIAL_PAGER: PagerState = { page: 1, total: 1, atStart: true, atEnd: true };

function samePager(left: PagerState, right: PagerState): boolean {
  return left.page === right.page && left.total === right.total && left.atStart === right.atStart && left.atEnd === right.atEnd;
}

export function ProductCarousel({ headingId, title, description, children }: ProductCarouselProps): React.ReactNode {
  const trackRef = useRef<HTMLUListElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [pager, setPager] = useState<PagerState>(INITIAL_PAGER);

  const measure = useCallback((): void => {
    const track = trackRef.current;
    if (!track) return;
    const width = track.clientWidth;
    if (width === 0) return;
    const maxScroll = Math.max(0, track.scrollWidth - width);
    const total = Math.max(1, Math.ceil((track.scrollWidth - EDGE_TOLERANCE_PX) / width));
    const atStart = track.scrollLeft <= EDGE_TOLERANCE_PX;
    const atEnd = track.scrollLeft >= maxScroll - EDGE_TOLERANCE_PX;
    const page = atEnd ? total : Math.min(total, Math.round(track.scrollLeft / width) + 1);
    const next: PagerState = { page, total, atStart, atEnd };
    setPager((current) => (samePager(current, next) ? current : next));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(track);
    return () => {
      observer.disconnect();
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [measure]);

  function handleScroll(): void {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      measure();
    });
  }

  function scrollByPage(direction: 1 | -1): void {
    const track = trackRef.current;
    if (!track) return;
    const atEdge = direction === 1 ? pager.atEnd : pager.atStart;
    if (atEdge) return;
    track.scrollBy({ left: direction * track.clientWidth, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  function restart(): void {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    track.querySelector<HTMLElement>("a[href]")?.focus({ preventScroll: true });
  }

  const paginated = pager.total > 1;
  const arrowClass =
    "absolute top-[32%] z-10 hidden h-20 w-10 -translate-y-1/2 items-center justify-center rounded-lg border border-line bg-white/95 text-ink shadow-md transition hover:bg-soft aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:bg-white/95 sm:flex";

  return (
    <section aria-labelledby={headingId} className={PRODUCT_SECTION_CLASS}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div>
          <h2 id={headingId} className={PRODUCT_SECTION_TITLE_CLASS}>
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-slate-600">{description}</p>}
        </div>
        {paginated && (
          <div className="flex items-center gap-3 text-sm">
            <p className="text-slate-600" aria-live="polite">
              Página {pager.page} de {pager.total}
            </p>
            {pager.page > 1 && (
              <button type="button" onClick={restart} className="rounded font-semibold text-brand-800 underline-offset-2 hover:underline">
                Comenzar de nuevo
              </button>
            )}
          </div>
        )}
      </div>

      <div className="relative mt-4">
        <ul
          ref={trackRef}
          onScroll={handleScroll}
          className="relative flex snap-x snap-mandatory scroll-px-1 gap-4 overflow-x-auto overscroll-x-contain px-1 pb-3 pt-1 [scrollbar-width:thin]"
        >
          {children}
        </ul>
        {paginated && (
          <>
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              aria-disabled={pager.atStart}
              aria-label={`Productos anteriores de ${title}`}
              className={`${arrowClass} -left-3`}
            >
              <IconChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              aria-disabled={pager.atEnd}
              aria-label={`Productos siguientes de ${title}`}
              className={`${arrowClass} -right-3`}
            >
              <IconChevronRight size={22} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
