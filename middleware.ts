import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/creators",
  "/videos",
  "/campaigns",
  "/planner",
  "/payouts",
  "/settings",
  "/checkout",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (pathname === "/checkout/growth" || pathname === "/signup/growth") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = redirectUrl.pathname.replace("/growth", "/scale");
    return NextResponse.redirect(redirectUrl);
  }

  // Wedding planner has its own sign-in screen and its own route tree.
  if (pathname === "/wedding" || pathname.startsWith("/wedding/")) {
    const isPublicWeddingPath =
      pathname === "/wedding/login" || pathname === "/wedding/signup";

    if (!user && !isPublicWeddingPath) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/wedding/login";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }

    if (user && pathname === "/wedding") {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/wedding/dashboard";
      dashboardUrl.search = "";
      return NextResponse.redirect(dashboardUrl);
    }

    return response;
  }

  // Wedding planner checkout uses the wedding sign-in screen, not the legacy login.
  if (pathname === "/checkout" || pathname.startsWith("/checkout/")) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/wedding/login";
      loginUrl.search = "";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  if (isProtectedPath(pathname) && !user) {
    const checkoutMatch = pathname.match(/^\/checkout\/(starter|scale)$/);

    if (checkoutMatch) {
      const signupUrl = request.nextUrl.clone();
      signupUrl.pathname = `/signup/${checkoutMatch[1]}`;
      signupUrl.search = "";
      return NextResponse.redirect(signupUrl);
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/onboarding" && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
