import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getInvoices } from "@/lib/database";
import { type InvoiceRecord, invoiceRecordSchema } from "@/lib/types";

export const runtime = "nodejs";

const notionExportSchema = z.object({
  notionToken: z.string().min(10),
  databaseId: z.string().min(10),
  invoices: z.array(invoiceRecordSchema).optional()
});

type NotionDatabaseProperties = Record<string, { type?: string }>;

function findPropertyName(properties: NotionDatabaseProperties, type: string, preferredNames: string[]): string | undefined {
  const normalizedPreferred = preferredNames.map((name) => name.toLowerCase());

  for (const [propertyName, definition] of Object.entries(properties)) {
    if (definition.type !== type) {
      continue;
    }

    if (normalizedPreferred.includes(propertyName.toLowerCase())) {
      return propertyName;
    }
  }

  for (const [propertyName, definition] of Object.entries(properties)) {
    if (definition.type === type) {
      return propertyName;
    }
  }

  return undefined;
}

function buildLineItemsText(invoice: InvoiceRecord): string {
  if (invoice.lineItems.length === 0) {
    return "No line items extracted.";
  }

  return invoice.lineItems
    .map((lineItem) => `${lineItem.description} | qty ${lineItem.quantity} | unit ${lineItem.unitPrice} | amount ${lineItem.amount}`)
    .join("\n");
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = notionExportSchema.parse(await request.json());
    const invoices = payload.invoices ?? (await getInvoices());

    if (invoices.length === 0) {
      return NextResponse.json({ error: "No invoices available to export." }, { status: 400 });
    }

    const notion = new Client({ auth: payload.notionToken });
    const database = await notion.databases.retrieve({ database_id: payload.databaseId });
    const properties = (database as { properties?: NotionDatabaseProperties }).properties ?? {};

    const titleProperty = findPropertyName(properties, "title", ["Vendor", "Name", "Title"]);

    if (!titleProperty) {
      return NextResponse.json({ error: "Target Notion database must include a title property." }, { status: 400 });
    }

    const invoiceNumberProperty = findPropertyName(properties, "rich_text", ["Invoice Number", "Invoice #", "Invoice"]);
    const dateProperty = findPropertyName(properties, "date", ["Invoice Date", "Date"]);
    const totalProperty = findPropertyName(properties, "number", ["Total", "Amount"]);
    const currencyProperty = findPropertyName(properties, "select", ["Currency"]);
    const sourceProperty = findPropertyName(properties, "rich_text", ["Source File"]);

    let exportedCount = 0;

    for (const invoice of invoices) {
      const notionProperties: Record<string, unknown> = {
        [titleProperty]: {
          title: [
            {
              text: {
                content: invoice.vendorName
              }
            }
          ]
        }
      };

      if (invoiceNumberProperty) {
        notionProperties[invoiceNumberProperty] = {
          rich_text: [
            {
              text: {
                content: invoice.invoiceNumber
              }
            }
          ]
        };
      }

      if (dateProperty) {
        notionProperties[dateProperty] = {
          date: {
            start: invoice.invoiceDate
          }
        };
      }

      if (totalProperty) {
        notionProperties[totalProperty] = {
          number: invoice.totalAmount
        };
      }

      if (currencyProperty) {
        notionProperties[currencyProperty] = {
          select: {
            name: invoice.currency
          }
        };
      }

      if (sourceProperty) {
        notionProperties[sourceProperty] = {
          rich_text: [
            {
              text: {
                content: invoice.sourceFileName
              }
            }
          ]
        };
      }

      await notion.pages.create({
        parent: {
          database_id: payload.databaseId
        },
        properties: notionProperties as Parameters<typeof notion.pages.create>[0]["properties"],
        children: [
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [
                {
                  type: "text",
                  text: {
                    content: `Line items:\n${buildLineItemsText(invoice)}`
                  }
                }
              ]
            }
          }
        ]
      });

      exportedCount += 1;
    }

    return NextResponse.json({ exported: exportedCount });
  } catch (caughtError) {
    if (caughtError instanceof z.ZodError) {
      return NextResponse.json({ error: caughtError.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    return NextResponse.json({ error: "Notion export failed. Verify token, database access, and property schema." }, { status: 500 });
  }
}
