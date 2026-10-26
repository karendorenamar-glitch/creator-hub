export default function InspirationLoading() {
  return (
    <div className="space-y-7">
      <div className="flex animate-pulse flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="h-3 w-32 rounded-full bg-petal-100" />
          <div className="h-10 w-72 max-w-full rounded-xl bg-olive-100" />
          <div className="h-4 w-96 max-w-full rounded bg-olive-50" />
        </div>
        <div className="h-11 w-40 rounded-xl bg-olive-100" />
      </div>

      <div className="animate-pulse rounded-[1.75rem] border border-petal-100 bg-white/70 p-4">
        <div className="h-11 w-full rounded-2xl bg-cream" />
        <div className="mt-3 flex gap-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-7 w-24 rounded-full bg-petal-50" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
          <div
            key={item}
            className="animate-pulse overflow-hidden rounded-[1.75rem] border border-petal-100/80 bg-white"
          >
            <div className="aspect-[4/5] bg-gradient-to-br from-petal-50 to-olive-50" />
            <div className="space-y-3 p-4">
              <div className="h-5 w-3/4 rounded bg-olive-50" />
              <div className="h-3 w-1/2 rounded bg-olive-50/70" />
              <div className="h-3 w-full rounded bg-olive-50/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
