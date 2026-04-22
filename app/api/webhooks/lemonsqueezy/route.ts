import { NextResponse } from "next/server";
import { markWebhookEventProcessed, savePaidSession } from "@/lib/database";
import { verifyStripeSignature } from "@/lib/stripe-webhook";

export const runtime = "nodejs";

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: {
      id?: string;
      customer_details?: {
        email?: string;
      };
    };
  };
};

export async function POST(request: Request): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not configured." }, { status: 500 });
  }

  const signatureHeader = request.headers.get("stripe-signature");
  const payload = await request.text();

  if (!verifyStripeSignature(payload, signatureHeader, webhookSecret)) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  let event: StripeEvent;

  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  const firstTimeEvent = await markWebhookEventProcessed(event.id);

  if (!firstTimeEvent) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (event.type === "checkout.session.completed") {
    const sessionId = event.data.object.id;

    if (sessionId) {
      await savePaidSession(sessionId, event.data.object.customer_details?.email);
    }
  }

  return NextResponse.json({ received: true });
}
