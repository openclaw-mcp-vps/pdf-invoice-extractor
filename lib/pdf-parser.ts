import pdfParse from "pdf-parse";

export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  const parsed = await pdfParse(pdfBuffer);

  return parsed.text
    .replace(/\u0000/g, " ")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
