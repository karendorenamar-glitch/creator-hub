import { revalidatePath } from "next/cache";

export function revalidateCreatorHub(campaignId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/creators");
  revalidatePath("/videos");
  revalidatePath("/campaigns");
  revalidatePath("/planner");
  revalidatePath("/payouts");
  if (campaignId) {
    revalidatePath(`/campaigns/${campaignId}`);
  }
}

export function revalidateContentPlanner() {
  revalidatePath("/planner");
  revalidatePath("/campaigns");
}

export function revalidatePayouts() {
  revalidatePath("/payouts");
  revalidatePath("/creators");
}

export function revalidateCreatorDetail(creatorId: string) {
  revalidatePath("/creators");
  revalidatePath(`/creators/${creatorId}`);
}
