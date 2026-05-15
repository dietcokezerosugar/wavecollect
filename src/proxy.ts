import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");
    const isAdminPage = req.nextUrl.pathname.startsWith("/admin") || req.nextUrl.pathname.startsWith("/api/admin");
    const isStaffPage = req.nextUrl.pathname.startsWith("/staff") || req.nextUrl.pathname.startsWith("/api/staff");
    const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard") || req.nextUrl.pathname.startsWith("/api/dashboard");

    if (isAuthPage) {
      if (isAuth) {
        const dest = token?.role === "ADMIN" ? "/admin" : token?.role === "STAFF" ? "/staff" : "/dashboard";
        return NextResponse.redirect(new URL(dest, req.url));
      }
      return null;
    }

    if (!isAuth) {
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }

      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
      );
    }

    // Role-based protection
    if (isAdminPage && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL(token?.role === "STAFF" ? "/staff" : "/dashboard", req.url));
    }

    if (isStaffPage && token?.role !== "STAFF" && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (isDashboardPage && token?.role === "STAFF") {
      return NextResponse.redirect(new URL("/staff", req.url));
    }
  },
  {
    callbacks: {
      async authorized() {
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/staff/:path*",
    "/api/dashboard/:path*",
    "/api/admin/:path*",
    "/api/staff/:path*",
    "/api/gpay-accounts/:path*",
    "/api/keys/:path*",
    "/api/payment-links/:path*",
    "/api/settings/:path*",
    "/login",
    "/register",
  ],
};
