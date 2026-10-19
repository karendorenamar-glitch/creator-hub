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

  const { error } = await ctx.supabase
    .from("checklist_tasks")
    .delete()
    .eq("id", id)
    .eq("wedding_id", ctx.session.wedding.id);

  if (error) return { error: actionError(error, ctx.copy) };

  revalidateWedding("/wedding/checklist");
  return null;
}
