export function getUserGreetingName(
  metadata: Record<string, unknown> | undefined,
  email: string | null | undefined,
) {
  const fullName = metadata?.full_name;

  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim().split(/\s+/)[0] ?? fullName.trim();
  }

  const localPart = email?.split("@")[0]?.trim();

  if (localPart) {
    return localPart.charAt(0).toUpperCase() + localPart.slice(1);
  }

  return "there";
}
