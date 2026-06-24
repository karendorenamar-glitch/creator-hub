"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { acceptTeamInvite } from "@/app/actions/team";
import { useToast } from "@/components/ui/toast";

export function AcceptTeamInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptTeamInvite(token);

      if ("error" in result && result.error) {
        showError(result.error);
        return;
      }

      showSuccess("You joined the workspace.");
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleAccept}
      disabled={isPending}
      className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-kefoo-400 px-4 py-3 text-sm font-medium text-white hover:bg-kefoo-300 disabled:opacity-60"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Accept invite
    </button>
  );
}
