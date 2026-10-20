export default function WeddingLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-olive-100" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded bg-olive-50" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-28 animate-pulse rounded-3xl border border-olive-100 bg-olive-50/60"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-3xl border border-olive-100 bg-olive-50/40" />
    </div>
  );
}
