import { CarouselSkeleton } from "../../../../components/store/product/carousel-skeleton";

const THUMBNAILS = [1, 2, 3, 4, 5];
const KEY_ROWS = [1, 2, 3, 4, 5];
const BULLETS = [1, 2, 3, 4];

export default function ProductLoading(): React.ReactNode {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-4 lg:pt-5" aria-busy="true">
      <p className="sr-only" role="status">
        Cargando producto…
      </p>
      <div className="skeleton h-4 w-72 max-w-full" />

      <div className="mt-3 grid grid-cols-1 gap-y-5 rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5 md:grid-cols-2 md:gap-x-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)_17rem] lg:gap-x-7 lg:p-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_18.5rem]">
        <div className="space-y-3 md:col-start-2 md:row-start-1">
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-7 w-full" />
          <div className="skeleton h-7 w-2/3" />
          <div className="skeleton h-4 w-48" />
        </div>

        <div className="md:col-start-1 md:row-span-4 md:row-start-1">
          <div className="skeleton aspect-square w-full rounded-xl md:hidden" />
          <div className="hidden gap-3 md:flex">
            <div className="flex w-14 shrink-0 flex-col gap-2">
              {THUMBNAILS.map((thumbnail) => (
                <div key={thumbnail} className="skeleton aspect-square w-full rounded-lg" />
              ))}
            </div>
            <div className="skeleton aspect-square min-w-0 flex-1 rounded-xl" />
          </div>
        </div>

        <div className="space-y-3 border-t border-line pt-4 md:col-start-2 md:row-start-2">
          <div className="skeleton h-9 w-48" />
          <div className="skeleton h-4 w-40" />
          <div className="flex gap-2">
            <div className="skeleton h-16 w-20 rounded-xl" />
            <div className="skeleton h-16 w-20 rounded-xl" />
            <div className="skeleton h-16 w-20 rounded-xl" />
          </div>
        </div>

        <div className="md:col-start-2 md:row-start-3 lg:col-start-3 lg:row-span-3 lg:row-start-1">
          <div className="space-y-3 rounded-2xl border border-line p-4">
            <div className="skeleton h-8 w-32" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-6 w-28" />
            <div className="skeleton h-12 w-full rounded-lg" />
            <div className="skeleton h-12 w-full rounded-lg" />
            <div className="skeleton h-20 w-full" />
          </div>
        </div>

        <div className="space-y-2.5 border-t border-line pt-4 md:col-start-2 md:row-start-4 lg:row-start-3">
          {KEY_ROWS.map((row) => (
            <div key={row} className="flex gap-4">
              <div className="skeleton h-4 w-1/3" />
              <div className="skeleton h-4 flex-1" />
            </div>
          ))}
          <div className="skeleton mt-4 h-5 w-44" />
          {BULLETS.map((bullet) => (
            <div key={bullet} className="skeleton h-4 w-full" />
          ))}
        </div>
      </div>

      <CarouselSkeleton />
    </div>
  );
}
