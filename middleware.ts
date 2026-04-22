import { NextRequest, NextResponse } from "next/server";
import { hasPaidAccessCookie } from "@/lib/auth";

export function middleware(request: NextRequest): NextResponse {
  if (hasPaidAccessCookie(request)) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error: "Payment required",
        message: "Purchase access first, then unlock your account from the success page."
      },
      { status: 402 }
    );
  }

  const redirectUrl = new URL("/unlock", request.url);
  redirectUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/upload/:path*", "/dashboard/:path*", "/api/upload", "/api/parse-invoice", "/api/export/:path*"]
};
