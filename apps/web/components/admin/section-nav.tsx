"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/ui/cn";

export interface SectionNavItem {
  id: string;
  label: string;
}

interface SectionNavProps {
  items: SectionNavItem[];
  label: string;
  heading?: string;
  className?: string;
}

const OBSERVER_ROOT_MARGIN = "-140px 0px -55% 0px";
const SCROLL_LOCK_MS = 900;

function sectionNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function revealWithin(container: HTMLElement, item: HTMLElement): void {
  const horizontal = container.scrollWidth > container.clientWidth;
  if (horizontal) {
    const start = item.offsetLeft;
    const end = start + item.offsetWidth;
    if (start < container.scrollLeft) container.scrollLeft = start - 8;
    if (end > container.scrollLeft + container.clientWidth) container.scrollLeft = end - container.clientWidth + 8;
    return;
  }
  const top = item.offsetTop;
  const bottom = top + item.offsetHeight;
  if (top < container.scrollTop) container.scrollTop = top - 8;
  if (bottom > container.scrollTop + container.clientHeight) container.scrollTop = bottom - container.clientHeight + 8;
}

function focusSection(target: HTMLElement): void {
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}

export function SectionNav({ items, label, heading = "En esta página", className }: SectionNavProps): React.ReactNode {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const visibility = useRef(new Map<string, boolean>());
  const lockedUntil = useRef(0);
  const listRef = useRef<HTMLOListElement | null>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());

  const registerLink = useCallback((id: string, node: HTMLAnchorElement | null): void => {
    if (!node) {
      linkRefs.current.delete(id);
      return;
    }
    linkRefs.current.set(id, node);
  }, []);

  useEffect(() => {
    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0) return;

    const tracked = visibility.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => tracked.set(entry.target.id, entry.isIntersecting));
        if (Date.now() < lockedUntil.current) return;
        const firstVisible = items.find((item) => tracked.get(item.id));
        if (!firstVisible) return;
        setActiveId(firstVisible.id);
      },
      { rootMargin: OBSERVER_ROOT_MARGIN, threshold: 0 }
    );

    elements.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      tracked.clear();
    };
  }, [items]);

  useEffect(() => {
    if (!activeId) return;
    const container = listRef.current;
    const link = linkRefs.current.get(activeId);
    if (!container || !link) return;
    revealWithin(container, link);
  }, [activeId]);

  function navigate(event: React.MouseEvent<HTMLAnchorElement>, id: string): void {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    lockedUntil.current = Date.now() + SCROLL_LOCK_MS;
    setActiveId(id);
    target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
    focusSection(target);
  }

  return (
    <nav
      aria-label={label}
      className={cn(
        "sticky top-16 z-20 rounded-2xl border border-ink-200 bg-white/95 shadow-card backdrop-blur lg:top-20 lg:bg-white lg:backdrop-blur-none",
        className
      )}
    >
      <p className="hidden px-4 pt-4 pb-2 text-xs font-bold tracking-[0.16em] text-ink-500 uppercase lg:block">{heading}</p>
      <ol
        ref={listRef}
        className="scrollbar-thin relative flex gap-1 overflow-x-auto p-2 lg:max-h-[calc(100dvh-10rem)] lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pt-0"
      >
        {items.map((item, index) => {
          const active = item.id === activeId;
          return (
            <li key={item.id} className="shrink-0">
              <a
                ref={(node) => registerLink(item.id, node)}
                href={`#${item.id}`}
                aria-current={active ? "true" : undefined}
                onClick={(event) => navigate(event, item.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap text-ink-700 transition-colors hover:bg-ink-50 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                  active && "bg-brand-50 font-semibold text-brand-800 hover:bg-brand-50"
                )}
              >
                <span aria-hidden="true" className={cn("font-mono text-[0.7rem] tabular-nums text-ink-500", active && "text-brand-700")}>
                  {sectionNumber(index)}
                </span>
                <span className="lg:truncate">{item.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
