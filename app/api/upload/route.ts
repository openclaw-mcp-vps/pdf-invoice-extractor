import { NextResponse } from "next/server";
import { extractInvoiceData } from "@/lib/ai-extractor";
import { saveInvoice } from "@/lib/database";
import { extractTextFromPdf } from "@/lib/pdf-parser";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const input = formData.get("file");

    if (!input || typeof input === "string" || !("arrayBuffer" in input)) {
      return NextResponse.json({ error: "Attach a PDF file in the `file` field." }, { status: 400 });
    }

    const file = input as File;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "PDF is too large. Max file size is 10MB." }, { status: 413 });
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return NextResponse.json({ error: "Only PDF files are supported." }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const extractedText = await extractTextFromPdf(fileBuffer);

    if (!extractedText) {
      return NextResponse.json({ error: "No readable text found in this PDF." }, { status: 422 });
    }

    const parsedInvoice = await extractInvoiceData(extractedText);

    const invoiceRecord = await saveInvoice({
      ...parsedInvoice,
      sourceFileName: file.name,
      extractedTextPreview: extractedText.slice(0, 500)
    });

    return NextResponse.json({ invoice: invoiceRecord });
  } catch {
    return NextResponse.json({ error: "Invoice parsing failed." }, { status: 500 });
  }
}
