export default function ProductLoading(): React.ReactNode {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="skeleton mb-6 h-4 w-64" />
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="skeleton aspect-square w-full rounded-2xl" />
          <div className="mt-3 grid grid-cols-5 gap-2">
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className="skeleton aspect-square rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-9 w-3/4" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-11 w-40" />
          <div className="skeleton h-12 w-full rounded-lg" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}
