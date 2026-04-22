"use client";

import { useState } from "react";
import Link from "next/link";
import { FileUp, LoaderCircle } from "lucide-react";
import { type InvoiceRecord } from "@/lib/types";

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD"
  }).format(amount);
}

export function FileUpload(): React.JSX.Element {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedInvoice, setUploadedInvoice] = useState<InvoiceRecord | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!file) {
      setError("Select a PDF invoice before uploading.");
      return;
    }

    setError(null);
    setUploadedInvoice(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
        throw new Error(payload?.error ?? payload?.message ?? "Upload failed.");
      }

      const payload = (await response.json()) as { invoice: InvoiceRecord };
      setUploadedInvoice(payload.invoice);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Invoice upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-[#2b3547] bg-[#111827]/95 p-6">
        <label htmlFor="invoice-file" className="block text-sm font-medium text-[#dbe7f5]">
          PDF file
        </label>
        <input
          id="invoice-file"
          type="file"
          accept="application/pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-3 block w-full rounded-lg border border-[#2b3547] bg-[#0f1726] px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-[#2f81f7] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
        />

        <button
          type="submit"
          disabled={isUploading}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#2f81f7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f6fda] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
          {isUploading ? "Extracting Invoice Data..." : "Upload and Extract"}
        </button>

        {error ? <p className="mt-4 rounded-lg border border-[#5c2732] bg-[#30151d] px-3 py-2 text-sm text-[#ffb3c2]">{error}</p> : null}
      </form>

      {uploadedInvoice ? (
        <article className="rounded-2xl border border-[#2b3547] bg-[#111827]/95 p-6">
          <header className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-[#8ea6c1]">Extraction Complete</p>
              <h2 className="mt-1 text-2xl font-semibold text-[#f0f6fc]">{uploadedInvoice.vendorName}</h2>
            </div>
            <Link href="/dashboard" className="rounded-lg border border-[#2b3547] px-3 py-2 text-sm font-medium text-[#dbe7f5] hover:bg-[#1b273b]">
              View Dashboard
            </Link>
          </header>

          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-[#2b3547] bg-[#0f1726] p-3">
              <dt className="text-xs uppercase tracking-[0.1em] text-[#8ea6c1]">Invoice #</dt>
              <dd className="mt-2 text-sm font-semibold text-[#e8f1fb]">{uploadedInvoice.invoiceNumber}</dd>
            </div>
            <div className="rounded-lg border border-[#2b3547] bg-[#0f1726] p-3">
              <dt className="text-xs uppercase tracking-[0.1em] text-[#8ea6c1]">Date</dt>
              <dd className="mt-2 text-sm font-semibold text-[#e8f1fb]">{uploadedInvoice.invoiceDate}</dd>
            </div>
            <div className="rounded-lg border border-[#2b3547] bg-[#0f1726] p-3">
              <dt className="text-xs uppercase tracking-[0.1em] text-[#8ea6c1]">Total</dt>
              <dd className="mt-2 text-sm font-semibold text-[#e8f1fb]">{formatCurrency(uploadedInvoice.totalAmount, uploadedInvoice.currency)}</dd>
            </div>
            <div className="rounded-lg border border-[#2b3547] bg-[#0f1726] p-3">
              <dt className="text-xs uppercase tracking-[0.1em] text-[#8ea6c1]">Confidence</dt>
              <dd className="mt-2 text-sm font-semibold text-[#e8f1fb]">{Math.round(uploadedInvoice.confidence * 100)}%</dd>
            </div>
          </dl>

          <div className="mt-5 rounded-lg border border-[#2b3547] bg-[#0f1726] p-4">
            <p className="mb-3 text-sm font-semibold text-[#dce8f6]">Line Items ({uploadedInvoice.lineItems.length})</p>
            {uploadedInvoice.lineItems.length === 0 ? (
              <p className="text-sm text-[#98aec5]">No structured line items were confidently detected in this file.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {uploadedInvoice.lineItems.map((item, index) => (
                  <li key={`${item.description}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#2b3547] bg-[#111b2d] px-3 py-2">
                    <span className="text-[#dce8f6]">{item.description}</span>
                    <span className="text-[#9eb2c8]">
                      {item.quantity} x {formatCurrency(item.unitPrice, uploadedInvoice.currency)} = {formatCurrency(item.amount, uploadedInvoice.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>
      ) : null}
    </section>
  );
}
