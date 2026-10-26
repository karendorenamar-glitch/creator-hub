import type { SupabaseClient } from "@supabase/supabase-js";
import type { Checklist, WeddingDatabase } from "@/lib/wedding/db-types";
import {
  KUA_TEMPLATE,
  KUA_TEMPLATE_KEY,
  kuaChecklistTitle,
} from "@/lib/wedding/kua-checklist";

type WeddingClient = SupabaseClient<WeddingDatabase>;

/**
 * Creates the current-year KUA snapshot once per wedding. Existing checklist
 * rows are never rewritten; missing template items are filled idempotently.
 */
export async function ensureKuaChecklist(
  supabase: WeddingClient,
  weddingId: string,
): Promise<void> {
  let checklist: Checklist | null = null;

  const { data: existing, error: findError } = await supabase
    .from("checklists")
    .select("*")
    .eq("wedding_id", weddingId)
    .eq("template_key", KUA_TEMPLATE_KEY)
    .maybeSingle();

  if (findError) throw new Error(findError.message);
  checklist = existing;

  if (!checklist) {
    const year = new Date().getFullYear();
    const { data: created, error: createError } = await supabase
      .from("checklists")
      .insert({
        wedding_id: weddingId,
        title: kuaChecklistTitle(year),
        kind: "builtin_kua",
        template_key: KUA_TEMPLATE_KEY,
        template_year: year,
      })
      .select("*")
      .single();

    if (createError) {
      if (createError.code !== "23505") {
        throw new Error(createError.message);
      }
      // Another request won the race; use the row it created.
      const { data: raced, error: racedError } = await supabase
        .from("checklists")
        .select("*")
        .eq("wedding_id", weddingId)
        .eq("template_key", KUA_TEMPLATE_KEY)
        .maybeSingle();
      if (racedError || !raced) {
        throw new Error(racedError?.message ?? createError.message);
      }
      checklist = raced;
    } else {
      checklist = created;
    }
  }

  if (!checklist) return;

  const { count, error: countError } = await supabase
    .from("checklist_tasks")
    .select("id", { count: "exact", head: true })
    .eq("checklist_id", checklist.id)
    .eq("wedding_id", weddingId);

  if (countError) throw new Error(countError.message);
  // Existing snapshots are immutable sources for their wedding. Only seed a
  // newly created or empty checklist; never inject later template additions.
  if (count && count > 0) return;

  const rows = KUA_TEMPLATE.map((item, index) => ({
    wedding_id: weddingId,
    checklist_id: checklist.id,
    group_name: item.group,
    sort_order: index,
    template_item_key: item.key,
    is_required: true,
    title: item.title,
    description: null,
    stage: item.stage,
    priority: "medium" as const,
    status: "todo" as const,
    due_date: null,
    assigned_to: null,
    completed_at: null,
  }));

  const { error: itemError } = await supabase.from("checklist_tasks").upsert(
    rows,
    {
      onConflict: "checklist_id,template_item_key",
      ignoreDuplicates: true,
    },
  );

  if (itemError) throw new Error(itemError.message);
}
