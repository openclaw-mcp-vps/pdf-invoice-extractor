import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { type ExtractedInvoice, type InvoiceRecord, type PaidSession } from "@/lib/types";

type DatabaseShape = {
  invoices: InvoiceRecord[];
  paidSessions: PaidSession[];
  webhookEvents: string[];
};

const dataDir = path.join(process.cwd(), "data");
const databaseFilePath = path.join(dataDir, "storage.json");

const EMPTY_DATABASE: DatabaseShape = {
  invoices: [],
  paidSessions: [],
  webhookEvents: []
};

async function ensureDatabaseFile(): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(databaseFilePath);
  } catch {
    await fs.writeFile(databaseFilePath, JSON.stringify(EMPTY_DATABASE, null, 2), "utf8");
  }
}

async function readDatabase(): Promise<DatabaseShape> {
  await ensureDatabaseFile();
  const content = await fs.readFile(databaseFilePath, "utf8");

  try {
    const parsed = JSON.parse(content) as DatabaseShape;
    return {
      invoices: parsed.invoices ?? [],
      paidSessions: parsed.paidSessions ?? [],
      webhookEvents: parsed.webhookEvents ?? []
    };
  } catch {
    await fs.writeFile(databaseFilePath, JSON.stringify(EMPTY_DATABASE, null, 2), "utf8");
    return EMPTY_DATABASE;
  }
}

async function writeDatabase(db: DatabaseShape): Promise<void> {
  await ensureDatabaseFile();
  await fs.writeFile(databaseFilePath, JSON.stringify(db, null, 2), "utf8");
}

export async function saveInvoice(input: ExtractedInvoice & { sourceFileName: string; extractedTextPreview?: string }): Promise<InvoiceRecord> {
  const db = await readDatabase();

  const invoiceRecord: InvoiceRecord = {
    ...input,
    id: randomUUID(),
    uploadedAt: new Date().toISOString()
  };

  db.invoices.unshift(invoiceRecord);
  await writeDatabase(db);

  return invoiceRecord;
}

export async function getInvoices(): Promise<InvoiceRecord[]> {
  const db = await readDatabase();
  return db.invoices;
}

export async function savePaidSession(sessionId: string, customerEmail?: string): Promise<void> {
  const db = await readDatabase();
  const alreadySaved = db.paidSessions.some((session) => session.sessionId === sessionId);

  if (alreadySaved) {
    return;
  }

  db.paidSessions.push({
    sessionId,
    customerEmail,
    purchasedAt: new Date().toISOString()
  });

  await writeDatabase(db);
}

export async function hasPaidSession(sessionId: string): Promise<boolean> {
  const db = await readDatabase();
  return db.paidSessions.some((session) => session.sessionId === sessionId);
}

export async function markWebhookEventProcessed(eventId: string): Promise<boolean> {
  const db = await readDatabase();

  if (db.webhookEvents.includes(eventId)) {
    return false;
  }

  db.webhookEvents.push(eventId);
  await writeDatabase(db);
  return true;
}
