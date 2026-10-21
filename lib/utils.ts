/** Tailwind class merge helper used across the wedding planner UI. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}