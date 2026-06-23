"use server";

import { syncCreatorCampaigns } from "@/app/actions/campaigns";
import { assertCanCreateResource } from "@/lib/plan-enforcement";
import { createClient } from "@/lib/supabase/server";
import { getOrgIdForAction } from "@/lib/org";
import {
  CREATOR_ALREADY_EXISTS_ERROR,
  CREATOR_NAME_EXISTS_ERROR,
  getCreatorDisplayUsername,
  normalizeCreatorContact,
  normalizeCreatorName,
  normalizeCreatorPlatformUsername,
  parseIDRInput,
  validateCreatorFee,
} from "@/lib/utils";
import { revalidateCreatorDetail, revalidateCreatorHub } from "@/lib/revalidate";
import type { Creator } from "@/types/database";

export type CreatorInput = {
  name: string;
  username: string;
  tiktok_username: string;
  instagram_username: string;
  threads_username: string;
  contact: string;
  notes: string;
  platform: string;
  followers: number;
  fee: number | string;
  campaign_id?: string;
  campaign_ids?: string[];
};

type CreatorWritePayload = {
  name: string;
  tiktok_username: string | null;
  instagram_username: string | null;
  threads_username: string | null;
  contact: string | null;
  notes: string | null;
  platform: string;
  followers: number;
  fee: number;
};

function applyPlatformUsername(
  platform: string,
  username: string | null,
): Pick<
  CreatorWritePayload,
  "tiktok_username" | "instagram_username" | "threads_username"
> {
  const normalized = normalizeCreatorPlatformUsername(username);

  switch (platform) {
    case "TikTok":
      return {
        tiktok_username: normalized,
        instagram_username: null,
        threads_username: null,
      };
    case "Instagram":
      return {
        tiktok_username: null,
        instagram_username: normalized,
        threads_username: null,
      };
    default:
      return {
        tiktok_username: normalized,
        instagram_username: null,
        threads_username: null,
      };
  }
}

function resolveCreatorUsername(input: CreatorInput): string | null {
  const direct = normalizeCreatorPlatformUsername(input.username);
  if (direct) return direct;

  return getCreatorDisplayUsername({
    platform: input.platform,
    tiktok_username: normalizeCreatorPlatformUsername(input.tiktok_username),
    instagram_username: normalizeCreatorPlatformUsername(input.instagram_username),
    threads_username: normalizeCreatorPlatformUsername(input.threads_username),
  });
}

function buildCreatorPayload(input: CreatorInput) {
  const feeResult = validateCreatorFee(input.fee);

  if (feeResult.error || feeResult.fee == null) {
    return { error: feeResult.error ?? "Fee is invalid." };
  }

  const username = resolveCreatorUsername(input);
  const platformUsernames = applyPlatformUsername(input.platform, username);
  const name = normalizeCreatorName(input.name) || (username ? `@${username}` : "");

  const payload: CreatorWritePayload = {
    name,
    ...platformUsernames,
    contact: normalizeCreatorContact(input.contact),
    notes: input.notes.trim() || null,
    platform: input.platform.trim(),
    followers: parseIDRInput(input.followers),
    fee: feeResult.fee,
  };

  if (!username) {
    return { error: "Username is required." };
  }

  if (!payload.name) {
    return { error: "Name or username is required." };
  }

  return { payload };
}

function mapCreatorRow(
  creator: Creator & { fee?: number | string | null },
): Creator {
  return {
    ...creator,
    fee: parseIDRInput(creator.fee),
  };
}

const creatorSelect =
  "id, org_id, name, tiktok_username, instagram_username, threads_username, contact, notes, platform, followers, fee, created_at";

function isUniqueViolation(message: string, code?: string | null) {
  return (
    code === "23505" ||
    message.toLowerCase().includes("duplicate key") ||
    message.toLowerCase().includes("creators_name_contact_unique")
  );
}

function duplicateCreatorError(contact: string | null) {
  return contact ? CREATOR_ALREADY_EXISTS_ERROR : CREATOR_NAME_EXISTS_ERROR;
}

async function findDuplicateCreator(
  orgId: string,
  name: string,
  contact: string | null,
  excludeId?: string,
) {
  const supabase = await createClient();

  if (contact) {
    let query = supabase
      .from("creators")
      .select("id")
      .eq("org_id", orgId)
      .eq("name", name)
      .eq("contact", contact);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      return { error: error.message };
    }

    if (data) {
      return { error: CREATOR_ALREADY_EXISTS_ERROR };
    }

    return {};
  }

  let query = supabase
    .from("creators")
    .select("id")
    .eq("org_id", orgId)
    .eq("name", name);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    return { error: error.message };
  }

  if (data?.length) {
    return { error: CREATOR_NAME_EXISTS_ERROR };
  }

  return {};
}

type CreatorDeleteBlockers = {
  videoCount: number;
  campaignCount: number;
};

function isForeignKeyViolation(message: string, code?: string | null) {
  return (
    code === "23503" ||
    message.toLowerCase().includes("foreign key") ||
    message.toLowerCase().includes("violates foreign key constraint")
  );
}

async function getCreatorDeleteBlockers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
): Promise<CreatorDeleteBlockers> {
  const [videosResult, campaignsResult] = await Promise.all([
    supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", id),
    supabase
      .from("campaign_creators")
      .select("campaign_id", { count: "exact", head: true })
      .eq("creator_id", id),
  ]);

  return {
    videoCount: videosResult.count ?? 0,
    campaignCount: campaignsResult.count ?? 0,
  };
}

function formatCreatorDeleteError(
  blockers: CreatorDeleteBlockers,
  supabaseError: string,
) {
  const blockingRecords: string[] = [];

  if (blockers.videoCount > 0) {
    blockingRecords.push(
      `${blockers.videoCount} video${blockers.videoCount === 1 ? "" : "s"} (delete them on the Videos page)`,
    );
  }

  if (blockers.campaignCount > 0) {
    blockingRecords.push(
      `${blockers.campaignCount} campaign link${blockers.campaignCount === 1 ? "" : "s"} (remove this creator from those campaigns first)`,
    );
  }

  if (blockingRecords.length > 0) {
    return `${blockingRecords.join(" and ")} must be removed before deleting this creator. Supabase error: ${supabaseError}`;
  }

  return `This creator could not be deleted. Supabase error: ${supabaseError}`;
}

async function fetchCreatorById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("creators")
    .select(creatorSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "Creator not found." };
  }

  return { data: mapCreatorRow(data) };
}

function shouldRefreshCreatorName(
  currentName: string | null | undefined,
  username: string,
  displayName: string,
) {
  const trimmedName = currentName?.trim() ?? "";
  const normalizedUsername = username.toLowerCase();

  if (!trimmedName) return true;

  return (
    trimmedName.toLowerCase() === `@${normalizedUsername}` ||
    trimmedName.toLowerCase() === normalizedUsername
  );
}

export async function syncCreatorTikTokUsername(
  creatorId: string,
  username: string | null | undefined,
) {
  await syncCreatorTikTokProfile(creatorId, { username });
}

export async function syncCreatorTikTokProfile(
  creatorId: string,
  options: {
    username?: string | null;
    displayName?: string | null;
  },
) {
  if (!creatorId) return;

  const normalized = normalizeCreatorPlatformUsername(options.username);
  if (!normalized) return;

  const supabase = await createClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("name")
    .eq("id", creatorId)
    .maybeSingle();

  const displayName = options.displayName?.trim();
  const updatePayload: {
    tiktok_username: string;
    name?: string;
  } = {
    tiktok_username: normalized,
  };

  if (
    displayName &&
    shouldRefreshCreatorName(creator?.name, normalized, displayName)
  ) {
    updatePayload.name = displayName;
  }

  await supabase.from("creators").update(updatePayload).eq("id", creatorId);
}

export async function syncCreatorInstagramUsername(
  creatorId: string,
  username: string | null | undefined,
) {
  await syncCreatorInstagramProfile(creatorId, { username });
}

export async function syncCreatorInstagramProfile(
  creatorId: string,
  options: {
    username?: string | null;
    displayName?: string | null;
  },
) {
  if (!creatorId) return;

  const normalized = normalizeCreatorPlatformUsername(options.username);
  if (!normalized) return;

  const supabase = await createClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("name")
    .eq("id", creatorId)
    .maybeSingle();

  const displayName = options.displayName?.trim() || `@${normalized}`;
  const updatePayload: {
    instagram_username: string;
    name?: string;
  } = {
    instagram_username: normalized,
  };

  if (shouldRefreshCreatorName(creator?.name, normalized, displayName)) {
    updatePayload.name = displayName;
  }

  await supabase.from("creators").update(updatePayload).eq("id", creatorId);
}

export async function findOrCreateCreatorForTikTokUsername(
  username: string,
  options: {
    platform: string;
    displayName?: string | null;
    followers?: number;
    autoCreate?: boolean;
    revalidate?: boolean;
  },
) {
  const orgResult = await getOrgIdForAction();
  if ("error" in orgResult) {
    return { error: orgResult.error };
  }

  const normalized = normalizeCreatorPlatformUsername(username);

  if (!normalized) {
    return { error: "Could not read TikTok username from this link." };
  }

  const supabase = await createClient();
  const { data: creators, error } = await supabase
    .from("creators")
    .select("id, tiktok_username")
    .eq("org_id", orgResult.orgId);

  if (error) {
    return { error: error.message };
  }

  const existing = creators?.find(
    (creator) =>
      normalizeCreatorPlatformUsername(creator.tiktok_username) === normalized,
  );

  if (existing) {
    await syncCreatorTikTokProfile(existing.id, {
      username: normalized,
      displayName: options.displayName,
    });
    return { creatorId: existing.id, created: false as const };
  }

  if (options.autoCreate === false) {
    return {
      error: `No creator found for @${normalized}. Add them on the Creators page first.`,
    };
  }

  const limitCheck = await assertCanCreateResource(orgResult.orgId, "creators");
  if ("error" in limitCheck) {
    return { error: limitCheck.error };
  }

  const displayName = options.displayName?.trim() || `@${normalized}`;
  const payload = {
    org_id: orgResult.orgId,
    name: displayName,
    tiktok_username: normalized,
    instagram_username: null,
    threads_username: null,
    contact: normalized,
    notes: null,
    platform: options.platform.trim() || "TikTok",
    followers: Math.max(0, options.followers ?? 0),
    fee: 0,
  };

  const { data: created, error: insertError } = await supabase
    .from("creators")
    .insert(payload)
    .select("id")
    .maybeSingle();

  if (insertError) {
    if (isUniqueViolation(insertError.message, insertError.code)) {
      const retry = creators?.find(
        (creator) =>
          normalizeCreatorPlatformUsername(creator.tiktok_username) ===
          normalized,
      );

      if (retry) {
        return { creatorId: retry.id, created: false as const };
      }
    }

    return { error: insertError.message };
  }

  if (!created?.id) {
    return { error: "Failed to create creator." };
  }

  if (options.revalidate !== false) {
    revalidateCreatorHub();
  }

  return { creatorId: created.id, created: true as const };
}

export async function findOrCreateCreatorForInstagramUsername(
  username: string,
  options: {
    platform?: string;
    displayName?: string | null;
    followers?: number;
    autoCreate?: boolean;
    revalidate?: boolean;
  },
) {
  const orgResult = await getOrgIdForAction();
  if ("error" in orgResult) {
    return { error: orgResult.error };
  }

  const normalized = normalizeCreatorPlatformUsername(username);

  if (!normalized) {
    return { error: "Could not read Instagram username from this link." };
  }

  const supabase = await createClient();
  const { data: creators, error } = await supabase
    .from("creators")
    .select("id, instagram_username")
    .eq("org_id", orgResult.orgId);

  if (error) {
    return { error: error.message };
  }

  const existing = creators?.find(
    (creator) =>
      normalizeCreatorPlatformUsername(creator.instagram_username) ===
      normalized,
  );

  if (existing) {
    await syncCreatorInstagramProfile(existing.id, {
      username: normalized,
      displayName: options.displayName,
    });
    return { creatorId: existing.id, created: false as const };
  }

  if (options.autoCreate === false) {
    return {
      error: `No creator found for @${normalized}. Add them on the Creators page first.`,
    };
  }

  const limitCheck = await assertCanCreateResource(orgResult.orgId, "creators");
  if ("error" in limitCheck) {
    return { error: limitCheck.error };
  }

  const displayName = options.displayName?.trim() || `@${normalized}`;
  const payload = {
    org_id: orgResult.orgId,
    name: displayName,
    tiktok_username: null,
    instagram_username: normalized,
    threads_username: null,
    contact: normalized,
    notes: null,
    platform: options.platform?.trim() || "Instagram",
    followers: Math.max(0, options.followers ?? 0),
    fee: 0,
  };

  const { data: created, error: insertError } = await supabase
    .from("creators")
    .insert(payload)
    .select("id")
    .maybeSingle();

  if (insertError) {
    if (isUniqueViolation(insertError.message, insertError.code)) {
      const retry = creators?.find(
        (creator) =>
          normalizeCreatorPlatformUsername(creator.instagram_username) ===
          normalized,
      );

      if (retry) {
        return { creatorId: retry.id, created: false as const };
      }
    }

    return { error: insertError.message };
  }

  if (!created?.id) {
    return { error: "Failed to create creator." };
  }

  if (options.revalidate !== false) {
    revalidateCreatorHub();
  }

  return { creatorId: created.id, created: true as const };
}

/** @deprecated Use findOrCreateCreatorForTikTokUsername */
export async function findCreatorIdForTikTokUsername(username: string) {
  const result = await findOrCreateCreatorForTikTokUsername(username, {
    platform: "TikTok",
    autoCreate: false,
    revalidate: false,
  });

  if (result.error || !result.creatorId) {
    return { error: result.error ?? "Creator not found." };
  }

  return { creatorId: result.creatorId };
}

export async function createCreator(input: CreatorInput) {
  const orgResult = await getOrgIdForAction();
  if ("error" in orgResult) {
    return { error: orgResult.error };
  }

  const supabase = await createClient();
  const parsed = buildCreatorPayload(input);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const duplicate = await findDuplicateCreator(
    orgResult.orgId,
    parsed.payload.name,
    parsed.payload.contact,
  );

  if (duplicate.error) {
    return { error: duplicate.error };
  }

  const limitCheck = await assertCanCreateResource(orgResult.orgId, "creators");
  if ("error" in limitCheck) {
    return { error: limitCheck.error };
  }

  const { data: created, error: insertError } = await supabase
    .from("creators")
    .insert({
      ...parsed.payload,
      org_id: orgResult.orgId,
    })
    .select("id")
    .maybeSingle();

  if (insertError) {
    if (isUniqueViolation(insertError.message, insertError.code)) {
      return { error: duplicateCreatorError(parsed.payload.contact) };
    }

    return { error: insertError.message };
  }

  if (!created?.id) {
    return { error: "Failed to create creator." };
  }

  const campaignIds =
    input.campaign_ids?.filter(Boolean) ??
    (input.campaign_id?.trim() ? [input.campaign_id.trim()] : []);

  if (campaignIds.length > 0) {
    const linkResult = await syncCreatorCampaigns(created.id, campaignIds, {
      revalidate: false,
    });

    if (linkResult.error) {
      return { error: linkResult.error };
    }
  }

  const result = await fetchCreatorById(created.id);

  if (result.error || !result.data) {
    return { error: result.error ?? "Failed to load created creator." };
  }

  revalidateCreatorHub();
  return { data: result.data };
}

export async function updateCreator(id: string, input: CreatorInput) {
  if (!id) {
    return { error: "Creator id is required." };
  }

  const orgResult = await getOrgIdForAction();
  if ("error" in orgResult) {
    return { error: orgResult.error };
  }

  const supabase = await createClient();
  const parsed = buildCreatorPayload(input);

  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const payload = parsed.payload;

  const duplicate = await findDuplicateCreator(
    orgResult.orgId,
    payload.name,
    payload.contact,
    id,
  );

  if (duplicate.error) {
    return { error: duplicate.error };
  }

  const { data: updated, error: updateError } = await supabase
    .from("creators")
    .update({
      name: payload.name,
      tiktok_username: payload.tiktok_username,
      instagram_username: payload.instagram_username,
      threads_username: payload.threads_username,
      contact: payload.contact,
      notes: payload.notes,
      platform: payload.platform,
      followers: payload.followers,
      fee: payload.fee,
    })
    .eq("id", id)
    .eq("org_id", orgResult.orgId)
    .select(creatorSelect)
    .maybeSingle();

  if (updateError) {
    if (isUniqueViolation(updateError.message, updateError.code)) {
      return { error: duplicateCreatorError(payload.contact) };
    }

    return { error: updateError.message };
  }

  if (!updated) {
    return {
      error:
        "Update did not save. Ensure the creators UPDATE policy exists in Supabase (see supabase/policies-crud.sql).",
    };
  }

  const campaignIds =
    input.campaign_ids?.filter(Boolean) ??
    (input.campaign_id?.trim() ? [input.campaign_id.trim()] : undefined);

  if (campaignIds !== undefined) {
    const linkResult = await syncCreatorCampaigns(id, campaignIds, {
      revalidate: false,
    });

    if (linkResult.error) {
      return { error: linkResult.error };
    }
  }

  revalidateCreatorHub();
  revalidateCreatorDetail(id);
  return { data: mapCreatorRow(updated) };
}

export async function deleteCreator(id: string) {
  if (!id) {
    return { error: "Creator id is required." };
  }

  const orgResult = await getOrgIdForAction();
  if ("error" in orgResult) {
    return { error: orgResult.error };
  }

  const supabase = await createClient();

  const { error, count } = await supabase
    .from("creators")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("org_id", orgResult.orgId);

  if (error) {
    const blockers = await getCreatorDeleteBlockers(supabase, id);

    if (isForeignKeyViolation(error.message, error.code)) {
      return { error: formatCreatorDeleteError(blockers, error.message) };
    }

    return { error: `Supabase error: ${error.message}` };
  }

  if (!count) {
    return {
      error:
        "Creator not found or delete was blocked. Supabase error: No rows were deleted.",
    };
  }

  revalidateCreatorHub();
  revalidateCreatorDetail(id);
  return { success: true };
}
