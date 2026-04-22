import { z } from "zod";

export const invoiceLineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().nonnegative(),
  unitPrice: z.number().nonnegative(),
  amount: z.number().nonnegative()
});

export const extractedInvoiceSchema = z.object({
  vendorName: z.string().min(1),
  invoiceNumber: z.string().min(1),
  invoiceDate: z.string().min(1),
  dueDate: z.string().optional(),
  totalAmount: z.number().nonnegative(),
  currency: z.string().min(1),
  lineItems: z.array(invoiceLineItemSchema),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional()
});

export type InvoiceLineItem = z.infer<typeof invoiceLineItemSchema>;
export type ExtractedInvoice = z.infer<typeof extractedInvoiceSchema>;

export const invoiceRecordSchema = extractedInvoiceSchema.extend({
  id: z.string().min(1),
  sourceFileName: z.string().min(1),
  uploadedAt: z.string().min(1),
  extractedTextPreview: z.string().optional()
});

export type InvoiceRecord = z.infer<typeof invoiceRecordSchema>;

export type PaidSession = {
  sessionId: string;
  customerEmail?: string;
  purchasedAt: string;
};
