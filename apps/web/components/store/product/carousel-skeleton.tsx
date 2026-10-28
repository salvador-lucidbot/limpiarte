import { PRODUCT_SECTION_CLASS } from "./section-styles";

const PLACEHOLDER_CARDS = [1, 2, 3, 4, 5, 6];

export function CarouselSkeleton(): React.ReactNode {
  return (
    <div className={PRODUCT_SECTION_CLASS} aria-hidden="true">
      <div className="skeleton h-6 w-72 max-w-full" />
      <div className="mt-4 flex gap-4 overflow-hidden">
        {PLACEHOLDER_CARDS.map((card) => (
          <div key={card} className="w-[10.5rem] shrink-0 sm:w-48">
            <div className="skeleton aspect-square w-full rounded-xl" />
            <div className="skeleton mt-2 h-4 w-full" />
            <div className="skeleton mt-1.5 h-4 w-2/3" />
            <div className="skeleton mt-2 h-6 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
