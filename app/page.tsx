import Link from "next/link";
import { cookies } from "next/headers";
import { ACCESS_COOKIE_NAME, ACCESS_COOKIE_VALUE } from "@/lib/auth";

const faqs = [
  {
    question: "How accurate is extraction on messy invoice PDFs?",
    answer:
      "InvoicePilot uses a structured extraction prompt with field-level validation, and every run returns confidence plus notes so you can quickly verify edge cases before export."
  },
  {
    question: "Can I export only line-item data?",
    answer:
      "Yes. CSV export includes one row per line item with invoice metadata attached, so you can analyze spend by category, vendor, or project in spreadsheets."
  },
  {
    question: "How does paywall access work?",
    answer:
      "After Stripe checkout, Stripe sends a webhook with the Checkout Session ID. You open /unlock with that session ID, and the app sets a secure access cookie for your browser."
  },
  {
    question: "Is my invoice data shared with other customers?",
    answer:
      "No. Each upload is parsed independently, and exports happen only when you trigger them. For production, point storage to your own database and infrastructure."
  }
];

export default async function LandingPage(): Promise<React.JSX.Element> {
  const cookieStore = await cookies();
  const hasAccess = cookieStore.get(ACCESS_COOKIE_NAME)?.value === ACCESS_COOKIE_VALUE;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-14 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#2b3547] bg-[#111827]/80 p-5 backdrop-blur">
        <div>
          <p className="text-sm uppercase tracking-[0.14em] text-[#8ea6c1]">InvoicePilot</p>
          <p className="text-sm text-[#b2c3d6]">AI invoice extraction for freelancers and small businesses</p>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="rounded-lg border border-[#2b3547] px-3 py-2 text-[#d6e2ef] hover:bg-[#1b2638]">
            Dashboard
          </Link>
          <Link href="/upload" className="rounded-lg bg-[#2f81f7] px-3 py-2 font-medium text-white hover:bg-[#1f6fda]">
            Open Tool
          </Link>
        </nav>
      </header>

      <section className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-[#2b3547] bg-gradient-to-br from-[#121b2c] to-[#101827] p-8 sm:p-10">
          <p className="mb-4 inline-flex rounded-full border border-[#2b3547] bg-[#172236] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#8ea6c1]">
            Stop Manual Re-Keying
          </p>
          <h1 className="text-4xl leading-tight font-bold text-[#f0f6fc] sm:text-5xl">
            Upload PDF invoices. Export clean accounting data in under a minute.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-[#b5c7da] sm:text-lg">
            InvoicePilot extracts vendor name, invoice number, invoice date, totals, and line items from incoming PDFs so you can ship organized records to your spreadsheet, Notion workspace, or Airtable base instantly.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK as string}
              className="rounded-xl bg-[#2f81f7] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1f6fda]"
            >
              Buy Access for $19/mo
            </a>
            <Link href="/unlock" className="rounded-xl border border-[#2b3547] px-5 py-3 text-sm font-semibold text-[#dce8f6] hover:bg-[#1b273b]">
              I Already Purchased
            </Link>
            {hasAccess ? (
              <Link href="/upload" className="rounded-xl border border-[#3fb950]/40 bg-[#142319] px-5 py-3 text-sm font-semibold text-[#8fe39d]">
                Access Active: Go to Upload
              </Link>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-[#2b3547] bg-[#111827]/90 p-8">
          <h2 className="text-xl font-semibold">Who this is for</h2>
          <ul className="mt-5 space-y-3 text-sm text-[#b8c9dc]">
            <li className="rounded-lg border border-[#2b3547] bg-[#101827] p-3">Freelancers handling 10-200 invoices monthly</li>
            <li className="rounded-lg border border-[#2b3547] bg-[#101827] p-3">Small teams tired of manual bookkeeping data entry</li>
            <li className="rounded-lg border border-[#2b3547] bg-[#101827] p-3">Agencies that need line-item visibility across vendors</li>
          </ul>
          <div className="mt-6 rounded-lg border border-[#2b3547] bg-[#0f1624] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-[#8ea6c1]">Outcome</p>
            <p className="mt-2 text-sm text-[#d6e2ef]">Cut invoice processing time from hours per month to minutes while reducing copy-paste errors in finance records.</p>
          </div>
        </div>
      </section>

      <section className="mt-14 grid gap-6 md:grid-cols-3">
        <article className="rounded-2xl border border-[#2b3547] bg-[#111827]/85 p-6">
          <h3 className="text-lg font-semibold">The Problem</h3>
          <p className="mt-3 text-sm text-[#b5c7da]">Finance admin work is repetitive and error-prone. Copying vendor names, dates, totals, and item rows manually kills momentum.</p>
        </article>
        <article className="rounded-2xl border border-[#2b3547] bg-[#111827]/85 p-6">
          <h3 className="text-lg font-semibold">The Solution</h3>
          <p className="mt-3 text-sm text-[#b5c7da]">Upload any invoice PDF, let AI extract structured fields, review confidence, and export data exactly where your bookkeeping process already lives.</p>
        </article>
        <article className="rounded-2xl border border-[#2b3547] bg-[#111827]/85 p-6">
          <h3 className="text-lg font-semibold">The Value</h3>
          <p className="mt-3 text-sm text-[#b5c7da]">At $19/month, saving even one hour of manual data entry pays for itself immediately for most independent operators.</p>
        </article>
      </section>

      <section className="mt-14 rounded-3xl border border-[#2b3547] bg-[#111827]/90 p-8">
        <h2 className="text-2xl font-semibold">Simple pricing</h2>
        <p className="mt-2 text-sm text-[#b5c7da]">One plan for freelancers and small businesses processing recurring invoice volume.</p>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-[#2b3547] bg-[#0f1726] p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.12em] text-[#8ea6c1]">InvoicePilot Pro</p>
            <p className="mt-2 text-4xl font-bold text-[#f0f6fc]">$19<span className="text-base font-medium text-[#98aec5]">/month</span></p>
            <p className="mt-3 max-w-xl text-sm text-[#b5c7da]">Unlimited invoice extraction runs, export to CSV/Airtable/Notion, and webhook-based paid access unlocking.</p>
          </div>
          <a
            href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK as string}
            className="rounded-xl bg-[#2f81f7] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1f6fda]"
          >
            Start With Stripe Checkout
          </a>
        </div>
      </section>

      <section className="mt-14 rounded-3xl border border-[#2b3547] bg-[#111827]/90 p-8">
        <h2 className="text-2xl font-semibold">FAQ</h2>
        <div className="mt-6 space-y-4">
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-xl border border-[#2b3547] bg-[#0f1726] p-4">
              <h3 className="text-base font-semibold text-[#e6edf3]">{faq.question}</h3>
              <p className="mt-2 text-sm text-[#b5c7da]">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
