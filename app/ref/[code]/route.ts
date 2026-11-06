import { NextResponse } from "next/server";
import { createWeddingAnonymousClient } from "@/lib/wedding/supabase";

const COOKIE = "kefoo_ref";

/** Records the click server-side, then sends the visitor to customer signup. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);

  if (clean.length < 4) {
    return NextResponse.redirect(new URL("/affiliate", request.url));
  }

  const supabase = createWeddingAnonymousClient();
  await supabase.rpc("record_affiliate_click", {
    p_code: clean,
    p_session: crypto.randomUUID(),
    p_landing: "/ref",
    p_referrer: request.headers.get("referer"),
  });

  const response = NextResponse.redirect(
    new URL(`/wedding/signup?ref=${clean}`, request.url),
  );
  response.cookies.set(COOKIE, clean, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
