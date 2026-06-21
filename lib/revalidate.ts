import { revalidatePath } from "next/cache";

export function revalidateCreatorHub(campaignId?: string) {
  revalidatePath("/");
  revalidatePath("/creators");
  revalidatePath("/videos");
  revalidatePath("/campaigns");
  if (campaignId) {
    revalidatePath(`/campaigns/${campaignId}`);
  }
}

export function revalidateCreatorDetail(creatorId: string) {
  revalidatePath("/creators");
  revalidatePath(`/creators/${creatorId}`);
}
