"use server";

import { redirect } from "next/navigation";
import {
  actionError,
  getActionContext,
  revalidateWedding,
  type ActionResult,
} from "@/lib/wedding/action-context";
import type { ModuleCopy } from "@/lib/wedding/module-copy";
import {
  enumValue,
  isDateString,
  isUuid,
  optionalText,
  optionalUuid,
  text,
} from "@/lib/wedding/validation";

const STAGES = [
  "planning",
  "12_plus_months",
  "9_to_12_months",
  "6_to_9_months",
  "3_to_6_months",
  "1_to_3_months",
  "final_month",
  "wedding_week",
] as const;

const PRIORITIES = ["low", "medium", "high"] as const;
const STATUSES = ["todo", "in_progress", "done"] as const;

async function context() {
  const ctx = await getActionContext();
  if (!ctx) redirect("/wedding/login");
  return ctx;
}

type TaskValues = {
  title: string;
  description: string | null;
  stage: (typeof STAGES)[number];
  priority: (typeof PRIORITIES)[number];
  status: (typeof STATUSES)[number];
  due_date: string | null;
  assigned_to: string | null;
  completed_at: string | null;
};

function readTask(
  formData: FormData,
  copy: ModuleCopy,
): { ok: true; values: TaskValues } | { ok: false; error: string } {
  const title = text(formData, "title").slice(0, 160);
  if (!title) return { ok: false, error: copy.form.required };

  const dueDate = text(formData, "dueDate");
  if (dueDate && !isDateString(dueDate)) {
    return { ok: false, error: copy.form.invalidDate };
  }

  const status = enumValue(formData, "status", STATUSES, "todo");

  return {
    ok: true,
    values: {
      title,
      description: optionalText(formData, "description", 2000),
      stage: enumValue(formData, "stage", STAGES, "planning"),
      priority: enumValue(formData, "priority", PRIORITIES, "medium"),
      status,
      due_date: dueDate || null,
      assigned_to: optionalUuid(formData, "assignedTo"),
      completed_at: status === "done" ? new Date().toISOString() : null,
    },
  };
}

export async function createTaskAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const parsed = readTask(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await ctx.supabase.from("checklist_tasks").insert({
    wedding_id: ctx.session.wedding.id,
    ...parsed.values,
  });

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/checklist");
  return { success: ctx.copy.form.saved };
}

export async function updateTaskAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const parsed = readTask(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const { data: existing } = await ctx.supabase
    .from("checklist_tasks")
    .select("checklist_id")
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id)
    .maybeSingle();

  if (!existing) return { error: ctx.copy.errors.notFound };
  if (existing.checklist_id) {
    return { error: ctx.copy.checklist.protectedItem };
  }

  const { error } = await ctx.supabase
    .from("checklist_tasks")
    .update(parsed.values)
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/checklist");
  return { success: ctx.copy.form.saved };
}

export async function toggleTaskAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  const completed = text(formData, "completed") === "true";

  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const { error } = await ctx.supabase
    .from("checklist_tasks")
    .update({
      status: completed ? "done" : "todo",
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/checklist");
  return null;
}

export async function deleteTaskAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const { data: existing } = await ctx.supabase
    .from("checklist_tasks")
    .select("checklist_id, is_required")
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id)
    .maybeSingle();

  if (!existing) return { error: ctx.copy.errors.notFound };
  if (existing.is_required || existing.checklist_id) {
    return { error: ctx.copy.checklist.protectedItem };
  }

  const { error } = await ctx.supabase
    .from("checklist_tasks")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/checklist");
  return null;
}

type ChecklistItemValues = {
  title: string;
  description: string | null;
  stage: (typeof STAGES)[number];
  priority: (typeof PRIORITIES)[number];
  due_date: string | null;
};

function readChecklistItem(
  formData: FormData,
  copy: ModuleCopy,
): { ok: true; values: ChecklistItemValues } | { ok: false; error: string } {
  const title = text(formData, "title").slice(0, 160);
  if (!title) return { ok: false, error: copy.form.required };

  const dueDate = text(formData, "dueDate");
  if (dueDate && !isDateString(dueDate)) {
    return { ok: false, error: copy.form.invalidDate };
  }

  return {
    ok: true,
    values: {
      title,
      description: optionalText(formData, "description", 2000),
      stage: enumValue(formData, "stage", STAGES, "planning"),
      priority: enumValue(formData, "priority", PRIORITIES, "medium"),
      due_date: dueDate || null,
    },
  };
}

async function checklistKind(
  ctx: Awaited<ReturnType<typeof context>>,
  checklistId: string,
): Promise<"custom" | "builtin_kua" | null> {
  const { data } = await ctx.supabase
    .from("checklists")
    .select("kind")
    .eq("id", checklistId)
    .eq("wedding_id", ctx.session.wedding.id)
    .maybeSingle();
  return data?.kind ?? null;
}

export async function createChecklistAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const title = text(formData, "title").slice(0, 120);
  if (!title) return { error: ctx.copy.form.required };

  const { error } = await ctx.supabase.from("checklists").insert({
    wedding_id: ctx.session.wedding.id,
    title,
    kind: "custom",
  });

  if (error) return { error: actionError(error, ctx.copy) };
  revalidateWedding("/wedding/checklist");
  return { success: ctx.copy.form.saved };
}

export async function renameChecklistAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  const title = text(formData, "title").slice(0, 120);
  if (!isUuid(id) || !title) return { error: ctx.copy.form.required };

  const kind = await checklistKind(ctx, id);
  if (!kind) return { error: ctx.copy.errors.notFound };
  if (kind === "builtin_kua") {
    return { error: ctx.copy.checklist.protectedChecklist };
  }

  const { error } = await ctx.supabase
    .from("checklists")
    .update({ title })
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };
  revalidateWedding("/wedding/checklist");
  return { success: ctx.copy.form.saved };
}

export async function deleteChecklistAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const kind = await checklistKind(ctx, id);
  if (!kind) return { error: ctx.copy.errors.notFound };
  if (kind === "builtin_kua") {
    return { error: ctx.copy.checklist.protectedChecklist };
  }

  const { error } = await ctx.supabase
    .from("checklists")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };
  revalidateWedding("/wedding/checklist");
  return null;
}

export async function createChecklistItemAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const checklistId = text(formData, "checklistId");
  if (!isUuid(checklistId)) return { error: ctx.copy.errors.notFound };

  const kind = await checklistKind(ctx, checklistId);
  if (!kind) return { error: ctx.copy.errors.notFound };
  if (kind === "builtin_kua") {
    return { error: ctx.copy.checklist.protectedChecklist };
  }

  const parsed = readChecklistItem(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const { data: last } = await ctx.supabase
    .from("checklist_tasks")
    .select("sort_order")
    .eq("checklist_id", checklistId)
    .eq("wedding_id", ctx.session.wedding.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await ctx.supabase.from("checklist_tasks").insert({
    wedding_id: ctx.session.wedding.id,
    checklist_id: checklistId,
    group_name: null,
    sort_order: (last?.sort_order ?? -1) + 1,
    template_item_key: null,
    is_required: false,
    ...parsed.values,
    status: "todo",
    assigned_to: null,
    completed_at: null,
  });

  if (error) return { error: actionError(error, ctx.copy) };
  revalidateWedding("/wedding/checklist");
  return { success: ctx.copy.form.saved };
}

export async function updateChecklistItemAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const { data: task } = await ctx.supabase
    .from("checklist_tasks")
    .select("checklist_id, is_required")
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id)
    .maybeSingle();

  if (!task?.checklist_id) return { error: ctx.copy.errors.notFound };
  const kind = await checklistKind(ctx, task.checklist_id);
  if (!kind) return { error: ctx.copy.errors.notFound };

  const parsed = readChecklistItem(formData, ctx.copy);
  if (!parsed.ok) return { error: parsed.error };

  const values =
    kind === "builtin_kua" || task.is_required
      ? {
          description: parsed.values.description,
          due_date: parsed.values.due_date,
        }
      : parsed.values;

  const { error } = await ctx.supabase
    .from("checklist_tasks")
    .update(values)
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };
  revalidateWedding("/wedding/checklist");
  return { success: ctx.copy.form.saved };
}



export async function deleteChecklistItemAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  if (!isUuid(id)) return { error: ctx.copy.errors.notFound };

  const { data: task } = await ctx.supabase
    .from("checklist_tasks")
    .select("checklist_id, is_required")
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id)
    .maybeSingle();

  if (!task?.checklist_id) return { error: ctx.copy.errors.notFound };
  const kind = await checklistKind(ctx, task.checklist_id);
  if (kind === "builtin_kua" || task.is_required) {
    return { error: ctx.copy.checklist.protectedItem };
  }

  const { error } = await ctx.supabase
    .from("checklist_tasks")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };
  revalidateWedding("/wedding/checklist");
  return null;
}

export async function moveChecklistItemAction(
  formData: FormData,
): Promise<ActionResult> {
  const ctx = await context();
  const id = text(formData, "id");
  const direction = text(formData, "direction");
  if (!isUuid(id) || !["up", "down"].includes(direction)) {
    return { error: ctx.copy.errors.notFound };
  }

  const { data: task } = await ctx.supabase
    .from("checklist_tasks")
    .select("checklist_id")
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id)
    .maybeSingle();

  if (!task?.checklist_id) return { error: ctx.copy.errors.notFound };
  const kind = await checklistKind(ctx, task.checklist_id);
  if (kind === "builtin_kua") {
    return { error: ctx.copy.checklist.protectedChecklist };
  }

  const { data: siblings } = await ctx.supabase
    .from("checklist_tasks")
    .select("id, sort_order")
    .eq("checklist_id", task.checklist_id)
    .eq("wedding_id", ctx.session.wedding.id)
    .order("sort_order", { ascending: true });

  const items = siblings ?? [];
  const index = items.findIndex((item) => item.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapIndex < 0 || swapIndex >= items.length) return null;

  const current = items[index];
  const other = items[swapIndex];
  const [{ error: firstError }, { error: secondError }] = await Promise.all([
    ctx.supabase
      .from("checklist_tasks")
      .update({ sort_order: other.sort_order })
      .eq("id", current.id)
      .eq("wedding_id", ctx.session.wedding.id),
    ctx.supabase
      .from("checklist_tasks")
      .update({ sort_order: current.sort_order })
      .eq("id", other.id)
      .eq("wedding_id", ctx.session.wedding.id),
  ]);

  if (firstError || secondError) {
    return { error: actionError(firstError ?? secondError!, ctx.copy) };
  }

  revalidateWedding("/wedding/checklist");
  return null;
}
