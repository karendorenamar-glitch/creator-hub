"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useTransition } from "react";

export function CreatorsSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const currentQuery = searchParams.get("q") ?? "";

  function handleSearch(value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value.trim()) {
      params.set("q", value.trim());
    } else {
      params.delete("q");
    }

    startTransition(() => {
      router.replace(`/creators?${params.toString()}`);
    });
  }

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        defaultValue={currentQuery}
        placeholder="Search creators..."
        onChange={(event) => handleSearch(event.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none ring-kefoo-500 focus:border-kefoo-500 focus:ring-2"
      />
      {isPending && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
          Searching...
        </span>
      )}
    </div>
  );
}
