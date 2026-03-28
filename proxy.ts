import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PATH_PREFIXES = [
  "/",
  "/login",
  "/signup",
  "/api/auth",
  "/api/public",
  "/charities",
  "/draw-mechanics",
  "/.well-known",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((path) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  });
}

const authProxy = auth((request) => {
  const pathname = request.nextUrl.pathname;
  const user = request.auth?.user;

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const destination = request.nextUrl.searchParams.get("next") ?? "/dashboard";
    if (destination.startsWith("/")) {
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export default authProxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};