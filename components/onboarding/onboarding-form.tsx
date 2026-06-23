"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { createOrganization } from "@/app/actions/org";
import { FormError, FormField, inputClassName } from "@/components/ui/modal";

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await createOrganization(name);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/campaigns");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Organization name" htmlFor="org-name">
        <input
          id="org-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClassName}
          placeholder="Acme Agency"
          disabled={loading}
          required
        />
      </FormField>

      <p className="text-sm text-slate-600">
        This creates your private workspace. Campaigns, creators, and videos
        stay inside this organization.
      </p>

      {error ? <FormError message={error} /> : null}

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="rounded-lg bg-kefoo-400 px-4 py-2.5 text-sm font-medium text-white hover:bg-kefoo-300 disabled:opacity-60"
      >
        {loading ? "Creating workspace..." : "Create workspace"}
      </button>
    </form>
  );
}
