const CART_TARGET_SELECTOR = "[data-cart-target]";
const DURATION_MS = 720;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function findSourceImage(trigger: HTMLElement): HTMLImageElement | null {
  const container = trigger.closest("article, [data-product-card], form, section");
  if (!container) return null;
  return container.querySelector("img");
}

export function flyToCart(trigger: HTMLElement | null): void {
  if (!trigger || typeof window === "undefined") return;
  if (prefersReducedMotion()) return;

  const target = document.querySelector(CART_TARGET_SELECTOR);
  if (!target) return;

  const source = findSourceImage(trigger) ?? trigger;
  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (from.width === 0 || to.width === 0) return;

  const size = Math.min(Math.max(from.width, 56), 120);
  const ghost = document.createElement("div");
  ghost.style.cssText = [
    "position:fixed",
    `left:${from.left + from.width / 2 - size / 2}px`,
    `top:${from.top + from.height / 2 - size / 2}px`,
    `width:${size}px`,
    `height:${size}px`,
    "border-radius:14px",
    "overflow:hidden",
    "z-index:80",
    "pointer-events:none",
    "background:#ffffff",
    "box-shadow:0 18px 40px rgba(14,47,70,0.28)"
  ].join(";");

  if (source instanceof HTMLImageElement) {
    const clone = document.createElement("img");
    clone.src = source.src;
    clone.alt = "";
    clone.style.cssText = "width:100%;height:100%;object-fit:cover";
    ghost.appendChild(clone);
  }

  document.body.appendChild(ghost);

  const deltaX = to.left + to.width / 2 - (from.left + from.width / 2);
  const deltaY = to.top + to.height / 2 - (from.top + from.height / 2);
  const liftY = Math.min(-120, deltaY * 0.45);

  const animation = ghost.animate(
    [
      { transform: "translate(0px, 0px) scale(1) rotate(0deg)", opacity: 1, offset: 0 },
      { transform: `translate(${deltaX * 0.35}px, ${liftY}px) scale(0.78) rotate(-6deg)`, opacity: 0.95, offset: 0.45 },
      { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.16) rotate(4deg)`, opacity: 0.25, offset: 1 }
    ],
    { duration: DURATION_MS, easing: "cubic-bezier(0.55, 0, 0.35, 1)", fill: "forwards" }
  );

  animation.onfinish = () => {
    ghost.remove();
    target.dispatchEvent(new CustomEvent("cart-fly-arrived", { bubbles: true }));
  };
}
