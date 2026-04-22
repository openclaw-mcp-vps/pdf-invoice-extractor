import { NextResponse } from "next/server";
import { z } from "zod";
import { hasPaidSession } from "@/lib/database";
import { setPaidAccessCookie } from "@/lib/auth";

export const runtime = "nodejs";

const claimSchema = z.object({
  sessionId: z.string().min(3)
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = claimSchema.parse(await request.json());
    const paid = await hasPaidSession(payload.sessionId);

    if (!paid) {
      return NextResponse.json(
        {
          error: "Payment is not confirmed yet for that session ID. If checkout just finished, wait 10-20 seconds and try again."
        },
        { status: 404 }
      );
    }

    const response = NextResponse.json({ ok: true });
    setPaidAccessCookie(response);
    return response;
  } catch (caughtError) {
    if (caughtError instanceof z.ZodError) {
      return NextResponse.json({ error: caughtError.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to claim access." }, { status: 500 });
  }
}
