// Runs on every request. Refreshes the Supabase session cookie and blocks
// unauthenticated access to /dashboard routes, so no individual page has
// to remember to check auth itself.
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  function applySecurityHeaders(nextResponse: NextResponse) {
    nextResponse.headers.set("X-Content-Type-Options", "nosniff");
    nextResponse.headers.set("X-Frame-Options", "DENY");
    nextResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    nextResponse.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    return nextResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard");

  if (isDashboardRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  return applySecurityHeaders(response);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
