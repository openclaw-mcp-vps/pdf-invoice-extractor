import Airtable from "airtable";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getInvoices } from "@/lib/database";
import { invoiceRecordSchema } from "@/lib/types";

export const runtime = "nodejs";

const airtableExportSchema = z.object({
  airtableToken: z.string().min(10),
  baseId: z.string().min(3),
  tableName: z.string().min(1),
  invoices: z.array(invoiceRecordSchema).optional()
});

function toFields(invoice: z.infer<typeof invoiceRecordSchema>): Record<string, unknown> {
  return {
    Vendor: invoice.vendorName,
    InvoiceNumber: invoice.invoiceNumber,
    InvoiceDate: invoice.invoiceDate,
    DueDate: invoice.dueDate ?? "",
    TotalAmount: invoice.totalAmount,
    Currency: invoice.currency,
    SourceFile: invoice.sourceFileName,
    UploadedAt: invoice.uploadedAt,
    Confidence: invoice.confidence,
    LineItems: JSON.stringify(invoice.lineItems)
  };
}

function chunk<T>(input: T[], size: number): T[][] {
  const result: T[][] = [];

  for (let index = 0; index < input.length; index += size) {
    result.push(input.slice(index, index + size));
  }

  return result;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = airtableExportSchema.parse(await request.json());
    const invoices = payload.invoices ?? (await getInvoices());

    if (invoices.length === 0) {
      return NextResponse.json({ error: "No invoices available to export." }, { status: 400 });
    }

    const base = new Airtable({ apiKey: payload.airtableToken }).base(payload.baseId);
    const table = base(payload.tableName) as unknown as {
      create: (
        records: Array<{ fields: Record<string, unknown> }>,
        options?: { typecast?: boolean }
      ) => Promise<unknown>;
    };

    let exportedCount = 0;

    for (const invoiceChunk of chunk(invoices, 10)) {
      await table.create(
        invoiceChunk.map((invoice) => ({
          fields: toFields(invoice)
        })),
        { typecast: true }
      );

      exportedCount += invoiceChunk.length;
    }

    return NextResponse.json({ exported: exportedCount });
  } catch (caughtError) {
    if (caughtError instanceof z.ZodError) {
      return NextResponse.json({ error: caughtError.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    return NextResponse.json({ error: "Airtable export failed. Confirm token, base, table, and field schema." }, { status: 500 });
  }
}
