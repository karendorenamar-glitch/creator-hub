/**
 * Run async work over items with a fixed concurrency limit.
 */
export async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
  onItemComplete?: (completed: number, total: number) => void,
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  let completed = 0;
  const limit = Math.max(1, Math.min(concurrency, items.length));

  async function runWorker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;

      if (index >= items.length) {
        return;
      }

      results[index] = await worker(items[index], index);
      completed += 1;
      onItemComplete?.(completed, items.length);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => runWorker()));
  return results;
}
