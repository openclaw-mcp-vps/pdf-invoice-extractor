"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { type InvoiceRecord } from "@/lib/types";

type ExportButtonsProps = {
  invoices?: InvoiceRecord[];
};

type ExportStatus = {
  kind: "success" | "error";
  message: string;
};

async function parseApiError(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
  return payload?.error ?? payload?.message ?? "Request failed";
}

export function ExportButtons({ invoices }: ExportButtonsProps): React.JSX.Element {
  const [status, setStatus] = useState<ExportStatus | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [notionLoading, setNotionLoading] = useState(false);
  const [airtableLoading, setAirtableLoading] = useState(false);

  const [notionToken, setNotionToken] = useState("");
  const [notionDatabaseId, setNotionDatabaseId] = useState("");

  const [airtableToken, setAirtableToken] = useState("");
  const [airtableBaseId, setAirtableBaseId] = useState("");
  const [airtableTableName, setAirtableTableName] = useState("Invoices");

  async function downloadCsv(): Promise<void> {
    setCsvLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/export/csv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ invoices })
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setStatus({ kind: "success", message: "CSV downloaded." });
    } catch (caughtError) {
      setStatus({ kind: "error", message: caughtError instanceof Error ? caughtError.message : "CSV export failed." });
    } finally {
      setCsvLoading(false);
    }
  }

  async function exportToNotion(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setNotionLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/export/notion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          notionToken,
          databaseId: notionDatabaseId,
          invoices
        })
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }

      const payload = (await response.json()) as { exported: number };
      setStatus({ kind: "success", message: `Exported ${payload.exported} invoice records to Notion.` });
    } catch (caughtError) {
      setStatus({ kind: "error", message: caughtError instanceof Error ? caughtError.message : "Notion export failed." });
    } finally {
      setNotionLoading(false);
    }
  }

  async function exportToAirtable(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setAirtableLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/export/airtable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          airtableToken,
          baseId: airtableBaseId,
          tableName: airtableTableName,
          invoices
        })
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }

      const payload = (await response.json()) as { exported: number };
      setStatus({ kind: "success", message: `Exported ${payload.exported} invoice records to Airtable.` });
    } catch (caughtError) {
      setStatus({ kind: "error", message: caughtError instanceof Error ? caughtError.message : "Airtable export failed." });
    } finally {
      setAirtableLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={downloadCsv}
          disabled={csvLoading}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2f81f7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f6fda] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {csvLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {csvLoading ? "Preparing CSV..." : "Download CSV"}
        </button>
      </div>

      <form onSubmit={exportToNotion} className="rounded-xl border border-[#2b3547] bg-[#0f1726] p-4">
        <h3 className="text-sm font-semibold text-[#dce8f6]">Export to Notion</h3>
        <p className="mt-1 text-xs text-[#98aec5]">Provide a Notion integration token and target database ID.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            type="password"
            value={notionToken}
            onChange={(event) => setNotionToken(event.target.value)}
            placeholder="Notion token"
            className="rounded-md border border-[#2b3547] bg-[#111b2d] px-3 py-2 text-sm"
            required
          />
          <input
            type="text"
            value={notionDatabaseId}
            onChange={(event) => setNotionDatabaseId(event.target.value)}
            placeholder="Notion database ID"
            className="rounded-md border border-[#2b3547] bg-[#111b2d] px-3 py-2 text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={notionLoading}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#2b3547] bg-[#1a2840] px-3 py-2 text-sm font-semibold text-[#dce8f6] hover:bg-[#233858] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {notionLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {notionLoading ? "Exporting..." : "Send to Notion"}
        </button>
      </form>

      <form onSubmit={exportToAirtable} className="rounded-xl border border-[#2b3547] bg-[#0f1726] p-4">
        <h3 className="text-sm font-semibold text-[#dce8f6]">Export to Airtable</h3>
        <p className="mt-1 text-xs text-[#98aec5]">Provide a Personal Access Token, Base ID, and table name.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <input
            type="password"
            value={airtableToken}
            onChange={(event) => setAirtableToken(event.target.value)}
            placeholder="Airtable token"
            className="rounded-md border border-[#2b3547] bg-[#111b2d] px-3 py-2 text-sm"
            required
          />
          <input
            type="text"
            value={airtableBaseId}
            onChange={(event) => setAirtableBaseId(event.target.value)}
            placeholder="Base ID"
            className="rounded-md border border-[#2b3547] bg-[#111b2d] px-3 py-2 text-sm"
            required
          />
          <input
            type="text"
            value={airtableTableName}
            onChange={(event) => setAirtableTableName(event.target.value)}
            placeholder="Table name"
            className="rounded-md border border-[#2b3547] bg-[#111b2d] px-3 py-2 text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={airtableLoading}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#2b3547] bg-[#1a2840] px-3 py-2 text-sm font-semibold text-[#dce8f6] hover:bg-[#233858] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {airtableLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {airtableLoading ? "Exporting..." : "Send to Airtable"}
        </button>
      </form>

      {status ? (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            status.kind === "success"
              ? "border-[#295935] bg-[#13241a] text-[#9fe3ad]"
              : "border-[#5c2732] bg-[#30151d] text-[#ffb3c2]"
          }`}
        >
          {status.message}
        </p>
      ) : null}
    </div>
  );
}
