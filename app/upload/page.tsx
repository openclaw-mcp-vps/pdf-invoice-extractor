import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FileUpload } from "@/components/FileUpload";
import { ACCESS_COOKIE_NAME, ACCESS_COOKIE_VALUE } from "@/lib/auth";

export default async function UploadPage(): Promise<React.JSX.Element> {
  const cookieStore = await cookies();
  const hasAccess = cookieStore.get(ACCESS_COOKIE_NAME)?.value === ACCESS_COOKIE_VALUE;

  if (!hasAccess) {
    redirect("/unlock?next=/upload");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 rounded-2xl border border-[#2b3547] bg-[#111827]/90 p-6">
        <h1 className="text-3xl font-bold text-[#f0f6fc]">Upload Invoice PDF</h1>
        <p className="mt-2 text-sm text-[#b5c7da]">
          Drag in an invoice PDF and InvoicePilot will extract vendor, invoice number, date, total amount, and line items.
        </p>
      </header>

      <FileUpload />
    </main>
  );
}
