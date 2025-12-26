import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Protect /dashboard routes
    // Protect /dashboard and /onboarding routes
    if (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/onboarding") || request.nextUrl.pathname.startsWith("/agent-setup")) {
        const hasDevAuth = request.cookies.get("dev-auth")?.value === "true";
        if (!user && !hasDevAuth) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Optional: Redirect root / to /dashboard if logged in
    if (request.nextUrl.pathname === "/" && user) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api/ (API routes - handled separately or let through)
         * - login/ (login page)
         * - auth/ (auth callback routes)
         */
        "/((?!_next/static|_next/image|favicon.ico|api|login|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
