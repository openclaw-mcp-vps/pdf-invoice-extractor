import { NextResponse } from "next/server";
import { z } from "zod";
import { extractInvoiceData } from "@/lib/ai-extractor";
import { saveInvoice } from "@/lib/database";

export const runtime = "nodejs";

const parseInvoiceSchema = z.object({
  text: z.string().min(20),
  fileName: z.string().optional(),
  persist: z.boolean().default(false)
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const payload = parseInvoiceSchema.parse(await request.json());
    const extractedInvoice = await extractInvoiceData(payload.text);

    if (payload.persist && payload.fileName) {
      const saved = await saveInvoice({
        ...extractedInvoice,
        sourceFileName: payload.fileName,
        extractedTextPreview: payload.text.slice(0, 500)
      });

      return NextResponse.json({ invoice: saved });
    }

    return NextResponse.json({ invoice: extractedInvoice });
  } catch (caughtError) {
    if (caughtError instanceof z.ZodError) {
      return NextResponse.json({ error: caughtError.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }

    return NextResponse.json({ error: "Invoice parsing failed." }, { status: 500 });
  }
}
