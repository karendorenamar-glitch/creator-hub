export function isTeamInvitePath(path: string | null | undefined) {
  return Boolean(path?.startsWith("/invite/"));
}

export function getTeamInviteToken(path: string) {
  const match = path.match(/^\/invite\/([^/?#]+)/);
  return match?.[1] ?? null;
}
