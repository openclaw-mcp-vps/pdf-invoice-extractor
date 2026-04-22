import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import "@/app/globals.css";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "700"]
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"]
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "InvoicePilot | Extract PDF Invoice Data in Seconds",
    template: "%s | InvoicePilot"
  },
  description:
    "Upload PDF invoices and automatically extract vendor, invoice number, date, total, and line items. Export to CSV, Airtable, and Notion in one click.",
  openGraph: {
    type: "website",
    title: "InvoicePilot",
    description:
      "Upload PDF invoices and automatically extract vendor, amount, date, and line items into clean structured records.",
    url: "/",
    siteName: "InvoicePilot",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "InvoicePilot invoice extraction dashboard"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "InvoicePilot",
    description: "AI-powered invoice extraction with CSV, Airtable, and Notion exports.",
    images: ["/og-image.svg"]
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en">
      <body className={`${headingFont.variable} ${bodyFont.variable} antialiased`}>{children}</body>
    </html>
  );
}
