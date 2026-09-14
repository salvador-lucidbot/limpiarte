export default function CatalogLoading(): React.ReactNode {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="skeleton mb-5 h-3.5 w-44" />
      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <div className="hidden space-y-6 lg:block">
          <div className="skeleton h-7 w-40" />
          <div className="skeleton h-3.5 w-24" />
          {[1, 2, 3].map((group) => (
            <div key={group} className="space-y-2">
              <div className="skeleton h-4 w-28" />
              <div className="skeleton h-3.5 w-36" />
              <div className="skeleton h-3.5 w-32" />
              <div className="skeleton h-3.5 w-40" />
            </div>
          ))}
        </div>
        <div>
          <div className="mb-4 flex justify-end">
            <div className="skeleton h-9 w-44" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
              <div key={index} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="skeleton aspect-square w-full rounded-none" />
                <div className="space-y-2 p-3.5">
                  <div className="skeleton h-3 w-16" />
                  <div className="skeleton h-4 w-full" />
                  <div className="skeleton h-6 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
