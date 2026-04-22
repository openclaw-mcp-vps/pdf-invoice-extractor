import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ExportButtons } from "@/components/ExportButtons";
import { InvoiceTable } from "@/components/InvoiceTable";
import { ACCESS_COOKIE_NAME, ACCESS_COOKIE_VALUE } from "@/lib/auth";
import { getInvoices } from "@/lib/database";

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD"
  }).format(amount);
}

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const cookieStore = await cookies();
  const hasAccess = cookieStore.get(ACCESS_COOKIE_NAME)?.value === ACCESS_COOKIE_VALUE;

  if (!hasAccess) {
    redirect("/unlock?next=/dashboard");
  }

  const invoices = await getInvoices();
  const invoiceCount = invoices.length;
  const aggregateTotal = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[#2b3547] bg-[#111827]/90 p-6">
        <div>
          <h1 className="text-3xl font-bold text-[#f0f6fc]">Extraction Dashboard</h1>
          <p className="mt-2 text-sm text-[#b5c7da]">Review parsed invoices and export clean records to your accounting stack.</p>
        </div>
        <Link href="/upload" className="rounded-lg bg-[#2f81f7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f6fda]">
          Upload Another Invoice
        </Link>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#2b3547] bg-[#111827]/90 p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-[#8ea6c1]">Invoices Parsed</p>
          <p className="mt-3 text-3xl font-bold text-[#f0f6fc]">{invoiceCount}</p>
        </div>
        <div className="rounded-2xl border border-[#2b3547] bg-[#111827]/90 p-5">
          <p className="text-xs uppercase tracking-[0.12em] text-[#8ea6c1]">Total Captured Value</p>
          <p className="mt-3 text-3xl font-bold text-[#f0f6fc]">{formatCurrency(aggregateTotal, "USD")}</p>
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-[#2b3547] bg-[#111827]/90 p-6">
        <h2 className="text-xl font-semibold">Export</h2>
        <p className="mt-2 text-sm text-[#b5c7da]">Download CSV immediately, or push records to Notion/Airtable by pasting your integration credentials.</p>
        <ExportButtons invoices={invoices} />
      </section>

      <section className="rounded-2xl border border-[#2b3547] bg-[#111827]/90 p-6">
        <h2 className="text-xl font-semibold">Invoices</h2>
        <p className="mt-2 text-sm text-[#b5c7da]">Each row includes extracted invoice metadata and expandable line items.</p>
        <div className="mt-4">
          <InvoiceTable invoices={invoices} />
        </div>
      </section>
    </main>
  );
}
