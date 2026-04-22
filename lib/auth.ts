import { NextRequest, NextResponse } from "next/server";

export const ACCESS_COOKIE_NAME = "invoice_access";
export const ACCESS_COOKIE_VALUE = "granted";
const ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function hasPaidAccessCookie(request: NextRequest): boolean {
  return request.cookies.get(ACCESS_COOKIE_NAME)?.value === ACCESS_COOKIE_VALUE;
}

export function setPaidAccessCookie(response: NextResponse): void {
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: ACCESS_COOKIE_VALUE,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ACCESS_MAX_AGE_SECONDS,
    path: "/"
  });
}
