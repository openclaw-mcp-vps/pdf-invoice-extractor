import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { type ExtractedInvoice, extractedInvoiceSchema, type InvoiceLineItem } from "@/lib/types";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function parseIsoDate(input: string | undefined): string {
  if (!input) {
    return new Date().toISOString().slice(0, 10);
  }

  const timestamp = Date.parse(input);

  if (!Number.isNaN(timestamp)) {
    return new Date(timestamp).toISOString().slice(0, 10);
  }

  const cleaned = input.replace(/,/g, " ").replace(/\s+/g, " ").trim();
  const parsedAgain = Date.parse(cleaned);

  if (!Number.isNaN(parsedAgain)) {
    return new Date(parsedAgain).toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

function parseAmount(raw: string | undefined): number {
  if (!raw) {
    return 0;
  }

  const normalized = raw.replace(/[^0-9.,-]/g, "").replace(/,(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const numeric = Number.parseFloat(normalized);
  return Number.isFinite(numeric) ? Math.max(numeric, 0) : 0;
}

function guessCurrency(text: string): string {
  if (text.includes("€") || /\bEUR\b/i.test(text)) {
    return "EUR";
  }

  if (text.includes("£") || /\bGBP\b/i.test(text)) {
    return "GBP";
  }

  if (text.includes("¥") || /\bJPY\b/i.test(text)) {
    return "JPY";
  }

  if (/\bCAD\b/i.test(text)) {
    return "CAD";
  }

  return "USD";
}

function heuristicLineItems(text: string): InvoiceLineItem[] {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const parsedItems: InvoiceLineItem[] = [];

  for (const line of lines) {
    const match = line.match(/^(.*?)(\d+(?:[.,]\d+)?)\s+(\$?\d+(?:[.,]\d+)?)\s+(\$?\d+(?:[.,]\d+)?)$/);

    if (!match) {
      continue;
    }

    const [, description, quantity, unitPrice, amount] = match;

    if (description.length < 3) {
      continue;
    }

    parsedItems.push({
      description: description.trim(),
      quantity: parseAmount(quantity),
      unitPrice: parseAmount(unitPrice),
      amount: parseAmount(amount)
    });

    if (parsedItems.length >= 20) {
      break;
    }
  }

  return parsedItems;
}

function heuristicExtract(text: string): ExtractedInvoice {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const vendorCandidate =
    lines.find((line) => !/invoice|bill to|date|total|amount due/i.test(line) && line.length >= 3 && line.length <= 120) ??
    "Unknown Vendor";

  const invoiceNumberMatch = text.match(/(?:invoice\s*(?:number|#|no\.?))\s*[:\-]?\s*([A-Z0-9-]+)/i);
  const dateMatch = text.match(/(?:invoice\s*date|date)\s*[:\-]?\s*([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{2,4}|\d{1,4}[\/.-]\d{1,2}[\/.-]\d{1,4})/i);

  const totalCandidates = [...text.matchAll(/(?:total\s*(?:due|amount)?|amount\s*due)\s*[:\-]?\s*([$€£]?\s*[0-9.,]+)/gi)]
    .map((match) => match[1])
    .filter(Boolean);

  const totalRaw = totalCandidates.at(-1) ?? "0";
  const lineItems = heuristicLineItems(text);

  return {
    vendorName: vendorCandidate,
    invoiceNumber: invoiceNumberMatch?.[1] ?? "UNKNOWN",
    invoiceDate: parseIsoDate(dateMatch?.[1]),
    totalAmount: parseAmount(totalRaw),
    currency: guessCurrency(text),
    lineItems,
    confidence: lineItems.length > 0 ? 0.6 : 0.45,
    notes: "Extracted using fallback parser because OpenAI API key is unavailable or model output failed validation."
  };
}

export async function extractInvoiceData(invoiceText: string): Promise<ExtractedInvoice> {
  if (!process.env.OPENAI_API_KEY) {
    return heuristicExtract(invoiceText);
  }

  try {
    const { object } = await generateObject({
      model: openai("gpt-4.1-mini"),
      schema: extractedInvoiceSchema,
      prompt: [
        "You extract invoice data from OCR-like PDF text.",
        "Return strict JSON only. Use ISO-8601 date format YYYY-MM-DD.",
        "Set confidence from 0 to 1 based on certainty.",
        "If line items are unavailable, return an empty array.",
        "If a value is missing, infer conservatively and explain uncertainty in notes.",
        "---",
        invoiceText
      ].join("\n")
    });

    return {
      ...object,
      invoiceDate: parseIsoDate(object.invoiceDate),
      dueDate: object.dueDate ? parseIsoDate(object.dueDate) : undefined,
      totalAmount: Math.max(object.totalAmount, 0),
      lineItems: object.lineItems.map((item) => ({
        ...item,
        quantity: Math.max(item.quantity, 0),
        unitPrice: Math.max(item.unitPrice, 0),
        amount: Math.max(item.amount, 0)
      }))
    };
  } catch {
    return heuristicExtract(invoiceText);
  }
}
