import React from "react";
import { existsSync } from "fs";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { QuotationPDF } from "@/components/documents/QuotationPDF";
import type { QuotationPDFProps } from "@/components/documents/QuotationPDF";

const logoPng = join(process.cwd(), "public", "logo.png");
const logoSrc = existsSync(logoPng) ? logoPng : undefined;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("quotations")
    .select("*, travellers(first_name, last_name, email, country, phone_number, phone_code), quotation_items(*)")
    .eq("id", id)
    .single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const quotation = data as QuotationPDFProps["quotation"];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(QuotationPDF, { quotation, logoSrc }) as any);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `attachment; filename="${quotation.number}.pdf"`,
    },
  });
}
