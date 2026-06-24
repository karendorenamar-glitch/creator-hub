"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type TeamFilterOption = {
  id: string;
  label: string;
};

type TeamFilterSelectProps = {
  selectedTeam: string;
  teamMembers: TeamFilterOption[];
  basePath: string;
  id?: string;
};

export function TeamFilterSelect({
  selectedTeam,
  teamMembers,
  basePath,
  id = "team-filter",
}: TeamFilterSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      params.delete("team");
    } else {
      params.set("team", value);
    }

    startTransition(() => {
      const query = params.toString();
      router.replace(query ? `${basePath}?${query}` : basePath);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        Team
      </label>
      <select
        id={id}
        value={selectedTeam}
        onChange={(event) => handleChange(event.target.value)}
        disabled={isPending}
        className="min-w-[220px] rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-kefoo-500 focus:border-kefoo-500 focus:ring-2 disabled:opacity-60"
      >
        <option value="all">All Team</option>
        {teamMembers.map((member) => (
          <option key={member.id} value={member.id}>
            {member.label}
          </option>
        ))}
      </select>
    </div>
  );
}
