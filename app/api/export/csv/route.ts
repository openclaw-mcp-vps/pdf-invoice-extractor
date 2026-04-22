import Papa from "papaparse";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getInvoices } from "@/lib/database";
import { invoiceRecordSchema } from "@/lib/types";

export const runtime = "nodejs";

const csvExportPayload = z.object({
  invoices: z.array(invoiceRecordSchema).optional()
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = csvExportPayload.parse(body);
    const invoices = parsed.invoices ?? (await getInvoices());

    const rows = invoices.flatMap((invoice) => {
      if (invoice.lineItems.length === 0) {
        return [
          {
            invoice_id: invoice.id,
            vendor_name: invoice.vendorName,
            invoice_number: invoice.invoiceNumber,
            invoice_date: invoice.invoiceDate,
            total_amount: invoice.totalAmount,
            currency: invoice.currency,
            due_date: invoice.dueDate ?? "",
            source_file: invoice.sourceFileName,
            uploaded_at: invoice.uploadedAt,
            line_item_description: "",
            line_item_quantity: 0,
            line_item_unit_price: 0,
            line_item_amount: 0
          }
        ];
      }

      return invoice.lineItems.map((lineItem) => ({
        invoice_id: invoice.id,
        vendor_name: invoice.vendorName,
        invoice_number: invoice.invoiceNumber,
        invoice_date: invoice.invoiceDate,
        total_amount: invoice.totalAmount,
        currency: invoice.currency,
        due_date: invoice.dueDate ?? "",
        source_file: invoice.sourceFileName,
        uploaded_at: invoice.uploadedAt,
        line_item_description: lineItem.description,
        line_item_quantity: lineItem.quantity,
        line_item_unit_price: lineItem.unitPrice,
        line_item_amount: lineItem.amount
      }));
    });

    const csv = Papa.unparse(rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="invoices-${new Date().toISOString().slice(0, 10)}.csv"`
      }
    });
  } catch (caughtError) {
    if (caughtError instanceof z.ZodError) {
      return NextResponse.json({ error: caughtError.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    return NextResponse.json({ error: "CSV export failed." }, { status: 500 });
  }
}
