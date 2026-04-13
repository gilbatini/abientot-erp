import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildQuotationPdf } from "@/lib/pdf/quotation-builder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    console.log("[pdf/quotation] fetching quotation", id);
    const { data, error } = await supabase
      .from("quotations")
      .select("*, travellers(first_name, last_name, email, country, phone_number, phone_code), quotation_items(*)")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("[pdf/quotation] supabase error:", error);
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    console.log("[pdf/quotation] building PDF for", (data as Record<string, unknown>).number);
    const buffer = await buildQuotationPdf(data as Record<string, unknown>);
    console.log("[pdf/quotation] PDF rendered, size:", buffer.length, "bytes");

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${(data as Record<string, unknown>).number}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[pdf/quotation] FATAL ERROR:");
    console.error(err instanceof Error ? err.stack : err);
    return NextResponse.json(
      { error: "PDF generation failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
