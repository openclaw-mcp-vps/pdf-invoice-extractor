import Link from "next/link";
import { UnlockForm } from "@/components/UnlockForm";

type UnlockPageProps = {
  searchParams: Promise<{
    session_id?: string;
    next?: string;
  }>;
};

export default async function UnlockPage({ searchParams }: UnlockPageProps): Promise<React.JSX.Element> {
  const params = await searchParams;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-[#2b3547] bg-[#111827]/90 p-8">
        <h1 className="text-3xl font-bold text-[#f0f6fc]">Unlock Your Access</h1>
        <p className="mt-3 text-sm text-[#b5c7da]">
          After Stripe checkout completes, Stripe sends a webhook with the Checkout Session ID. Paste that `session_id` below to activate your browser cookie-based access.
        </p>

        <div className="mt-6 rounded-xl border border-[#2b3547] bg-[#0f1726] p-4 text-sm text-[#c4d3e2]">
          <p className="font-semibold text-[#dce8f6]">Recommended Stripe success URL</p>
          <p className="mt-2 break-all font-mono text-xs text-[#9eb2c8]">https://your-domain.com/unlock?session_id={"{CHECKOUT_SESSION_ID}"}</p>
        </div>

        <div className="mt-6">
          <UnlockForm initialSessionId={params.session_id} nextPath={params.next} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK as string}
            className="rounded-lg bg-[#2f81f7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f6fda]"
          >
            Complete Stripe Checkout
          </a>
          <Link href="/" className="rounded-lg border border-[#2b3547] px-4 py-2 text-sm font-semibold text-[#dce8f6] hover:bg-[#1b273b]">
            Back to Landing Page
          </Link>
        </div>
      </section>
    </main>
  );
}
