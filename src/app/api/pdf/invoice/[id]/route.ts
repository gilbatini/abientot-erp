import React from "react";
import { existsSync } from "fs";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { InvoicePDF } from "@/components/documents/InvoicePDF";
import type { InvoicePDFProps } from "@/components/documents/InvoicePDF";

// Check once at module load — PNG only (@react-pdf Image does not support SVG)
const logoPng  = join(process.cwd(), "public", "logo.png");
const logoSrc  = existsSync(logoPng) ? logoPng : undefined;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("invoices")
    .select("*, travellers(first_name, last_name, email, country, phone_number, phone_code), invoice_items(*)")
    .eq("id", id)
    .single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const invoice = data as InvoicePDFProps["invoice"];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(InvoicePDF, { invoice, logoSrc }) as any);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  });
}
