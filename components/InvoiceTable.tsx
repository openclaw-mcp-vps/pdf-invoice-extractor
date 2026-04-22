import { type InvoiceRecord } from "@/lib/types";

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD"
  }).format(amount);
}

export function InvoiceTable({ invoices }: { invoices: InvoiceRecord[] }): React.JSX.Element {
  if (invoices.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#2b3547] bg-[#0f1726] p-6 text-sm text-[#9eb2c8]">
        No invoices yet. Upload your first PDF to populate this table.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[#2b3547] text-left text-xs uppercase tracking-[0.09em] text-[#8ea6c1]">
            <th className="px-3 py-3 font-medium">Vendor</th>
            <th className="px-3 py-3 font-medium">Invoice #</th>
            <th className="px-3 py-3 font-medium">Date</th>
            <th className="px-3 py-3 font-medium">Total</th>
            <th className="px-3 py-3 font-medium">Line Items</th>
            <th className="px-3 py-3 font-medium">Source</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border-b border-[#20293a] align-top">
              <td className="px-3 py-3 font-medium text-[#e6edf3]">{invoice.vendorName}</td>
              <td className="px-3 py-3 text-[#c8d7e8]">{invoice.invoiceNumber}</td>
              <td className="px-3 py-3 text-[#c8d7e8]">{invoice.invoiceDate}</td>
              <td className="px-3 py-3 text-[#c8d7e8]">{formatCurrency(invoice.totalAmount, invoice.currency)}</td>
              <td className="px-3 py-3 text-[#c8d7e8]">
                <details className="rounded-md border border-[#2b3547] bg-[#0f1726] p-2">
                  <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.08em] text-[#9eb2c8]">{invoice.lineItems.length} items</summary>
                  <ul className="mt-2 space-y-1">
                    {invoice.lineItems.length === 0 ? (
                      <li className="text-xs text-[#879cb3]">No line items captured</li>
                    ) : (
                      invoice.lineItems.map((lineItem, index) => (
                        <li key={`${invoice.id}-line-${index}`} className="text-xs text-[#b7c7d9]">
                          {lineItem.description} · {lineItem.quantity} x {formatCurrency(lineItem.unitPrice, invoice.currency)} = {formatCurrency(lineItem.amount, invoice.currency)}
                        </li>
                      ))
                    )}
                  </ul>
                </details>
              </td>
              <td className="px-3 py-3 text-xs text-[#98aec5]">
                <p>{invoice.sourceFileName}</p>
                <p className="mt-1">{new Date(invoice.uploadedAt).toLocaleString()}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
