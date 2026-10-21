import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** Reads the signed-in user and refreshes the Supabase session cookies. */
async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { response, user: null };

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}


export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Wedding planner has its own sign-in screen and its own route tree.
  if (pathname === "/wedding" || pathname.startsWith("/wedding/")) {
    const isPublicWeddingPath =
      pathname === "/wedding/login" ||
      pathname === "/wedding/signup" ||
      pathname === "/wedding/forgot-password" ||
      pathname === "/wedding/reset-password";

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


  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
