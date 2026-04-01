import { existsSync } from "fs";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const logoPng = join(process.cwd(), "public", "logo.png");
const logoSrc = existsSync(logoPng) ? logoPng : undefined;

// ── Brand ────────────────────────────────────────────────────────────────────
const BRAND_NAME    = "À Bientôt Tour & Travels Ltd";
const BRAND_SHORT   = "À Bientôt";
const BRAND_TAGLINE = "Pearl of Africa · Kampala, Uganda";
const BRAND_ADDRESS = "Reed Complex, Ntinda Kiwatule, Kampala, Uganda";
const BRAND_EMAIL   = "abientottours2023@gmail.com";
const BRAND_PHONE   = "+256 788 138 721";

// ── Palette ──────────────────────────────────────────────────────────────────
const TEAL        = "#2BBFB3";
const DARK        = "#1a1a1a";
const GRAY        = "#6b7280";
const BORDER_GRAY = "#e5e7eb";
const TEAL_LIGHT  = "#e6f9f8";

const PAYMENT_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  card:          "Card",
  mobile_money:  "Mobile Money",
  cash:          "Cash",
};

function fmt(amount: number, currency: string): string {
  const SYM: Record<string, string> = {
    USD:"$", EUR:"€", GBP:"£", UGX:"UGX ", KES:"KSh ",
    TZS:"TSh ", RWF:"RWF ", AED:"AED ", CAD:"C$", ZAR:"R",
  };
  const NO_DEC = ["UGX","KES","TZS","RWF"];
  const sym = SYM[currency] ?? currency + " ";
  return NO_DEC.includes(currency)
    ? sym + Math.round(amount).toLocaleString("en-US")
    : sym + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function buildPdf(receipt: Record<string, unknown>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true, info: {
      Title: `Receipt ${receipt.receipt_number}`,
      Author: BRAND_NAME,
    }});

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t        = receipt.travellers as any;
    const name     = t ? `${t.first_name} ${t.last_name}` : "—";
    const phone    = t?.phone_number
      ? [t.phone_code, t.phone_number].filter(Boolean).join(" ")
      : null;
    const payLabel = PAYMENT_LABELS[receipt.payment_method as string] ?? (receipt.payment_method ?? "—");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invNum   = (receipt.invoices as any)?.invoice_number ?? null;

    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const ML = 48;
    const MR = 48;
    const CONTENT_W = PAGE_W - ML - MR;

    let y = 40;

    // ── HEADER ───────────────────────────────────────────────────────────────
    if (logoSrc) {
      doc.image(logoSrc, ML, y, { width: 150, height: 42 });
    } else {
      doc.font("Helvetica-Bold").fontSize(16).fillColor(DARK).text(BRAND_SHORT, ML, y + 6);
    }

    doc.font("Helvetica").fontSize(8).fillColor(GRAY)
      .text(BRAND_ADDRESS, ML, y + 52)
      .text(`${BRAND_PHONE} · ${BRAND_EMAIL}`, ML, y + 63);

    const rightX = PAGE_W - MR;
    doc.font("Helvetica-Bold").fontSize(28).fillColor(DARK)
      .text("RECEIPT", 0, y, { width: rightX, align: "right" });

    doc.font("Helvetica-Bold").fontSize(16).fillColor(TEAL)
      .text(String(receipt.receipt_number), 0, y + 36, { width: rightX, align: "right" });

    doc.font("Helvetica").fontSize(9).fillColor(GRAY)
      .text("Payment Date: ", 0, y + 56, { width: rightX - 40, align: "right", continued: true })
      .font("Helvetica-Bold").fillColor(DARK)
      .text(fmtDate(receipt.payment_date as string));

    if (invNum) {
      doc.font("Helvetica").fontSize(9).fillColor(GRAY)
        .text("Invoice: ", 0, y + 70, { width: rightX - 40, align: "right", continued: true })
        .font("Helvetica-Bold").fillColor(DARK)
        .text(String(invNum));
    }

    y = 120;

    // ── DIVIDER ──────────────────────────────────────────────────────────────
    doc.moveTo(ML, y).lineTo(PAGE_W - MR, y).strokeColor(BORDER_GRAY).lineWidth(1).stroke();
    y += 16;

    // ── RECEIPT FOR / RECEIVED BY ────────────────────────────────────────────
    const colW = CONTENT_W * 0.46;

    doc.font("Helvetica-Bold").fontSize(8).fillColor(TEAL)
      .text("RECEIPT FOR", ML, y);
    y += 14;
    doc.font("Helvetica-Bold").fontSize(13).fillColor(DARK).text(name, ML, y);
    y += 18;
    if (phone) {
      doc.font("Helvetica").fontSize(9).fillColor(GRAY).text(phone as string, ML, y);
      y += 12;
    }
    if (t?.country) {
      doc.font("Helvetica").fontSize(9).fillColor(GRAY).text(t.country, ML, y);
      y += 12;
    }
    if (t?.email) {
      doc.font("Helvetica").fontSize(9).fillColor(GRAY).text(t.email, ML, y);
      y += 12;
    }

    const receivedY = y - 18 - (phone ? 12 : 0) - (t?.country ? 12 : 0) - (t?.email ? 12 : 0) - 14;
    const receivedX = ML + colW + CONTENT_W * 0.08;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(TEAL).text("RECEIVED BY", receivedX, receivedY);
    doc.font("Helvetica-Bold").fontSize(13).fillColor(DARK).text("À Bientôt Team", receivedX, receivedY + 14);
    doc.font("Helvetica").fontSize(9).fillColor(GRAY).text(BRAND_NAME, receivedX, receivedY + 32);

    y += 20;

    // ── AMOUNT PAID ──────────────────────────────────────────────────────────
    doc.rect(ML, y, CONTENT_W, 64).fill(TEAL_LIGHT);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(TEAL)
      .text("AMOUNT PAID", ML + 20, y + 12);
    doc.font("Helvetica-Bold").fontSize(30).fillColor(DARK)
      .text(fmt(receipt.amount_paid as number, receipt.currency as string), ML + 20, y + 26);
    y += 76;

    // ── PAYMENT DETAILS ───────────────────────────────────────────────────────
    doc.rect(ML, y, CONTENT_W, 18).fill("#f9fafb");

    const drawDetailRow = (label: string, value: string, isLast: boolean) => {
      doc.rect(ML, y, CONTENT_W, 22).fill("#f9fafb");
      doc.font("Helvetica").fontSize(8.5).fillColor(GRAY)
        .text(label, ML + 16, y + 6, { width: CONTENT_W * 0.5, lineBreak: false });
      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(DARK)
        .text(value, ML + CONTENT_W * 0.5, y + 6, { width: CONTENT_W * 0.5 - 16, align: "right", lineBreak: false });
      if (!isLast) {
        doc.moveTo(ML, y + 22).lineTo(PAGE_W - MR, y + 22).strokeColor(BORDER_GRAY).lineWidth(0.5).stroke();
      }
      y += 22;
    };

    const detailRows: [string, string][] = [
      ["Payment Method", String(payLabel)],
      ["Payment Date",   fmtDate(receipt.payment_date as string)],
    ];
    if (receipt.reference_number) detailRows.push(["Reference Number", String(receipt.reference_number)]);
    if (invNum) detailRows.push(["Invoice Reference", String(invNum)]);

    for (let i = 0; i < detailRows.length; i++) {
      drawDetailRow(detailRows[i][0], detailRows[i][1], i === detailRows.length - 1);
    }
    y += 12;

    // ── NOTES ────────────────────────────────────────────────────────────────
    if (receipt.notes) {
      doc.font("Helvetica-Bold").fontSize(8).fillColor(TEAL).text("NOTES", ML, y);
      doc.font("Helvetica").fontSize(8.5).fillColor(GRAY)
        .text(String(receipt.notes), ML, y + 14, { width: CONTENT_W / 2 - 8, lineGap: 4 });
    }

    // ── FOOTER ───────────────────────────────────────────────────────────────
    const footerY = PAGE_H - 36;
    doc.moveTo(ML, footerY).lineTo(PAGE_W - MR, footerY).strokeColor(BORDER_GRAY).lineWidth(1).stroke();
    doc.font("Helvetica").fontSize(7.5).fillColor("#9ca3af")
      .text(
        `Thank you for choosing ${BRAND_NAME} · ${BRAND_TAGLINE} · ${BRAND_PHONE} · ${BRAND_EMAIL}`,
        ML, footerY + 7, { width: CONTENT_W, align: "center" },
      );

    doc.end();
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    console.log("[pdf/receipt] fetching receipt", id);
    const { data, error } = await supabase
      .from("receipts")
      .select("*, travellers(first_name, last_name, email, country, phone_number, phone_code), invoices(invoice_number)")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("[pdf/receipt] supabase error:", error);
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    console.log("[pdf/receipt] building PDF for", (data as Record<string, unknown>).receipt_number);
    const buffer = await buildPdf(data as Record<string, unknown>);
    console.log("[pdf/receipt] PDF rendered, size:", buffer.length, "bytes");

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${(data as Record<string, unknown>).receipt_number}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[pdf/receipt] FATAL ERROR:");
    console.error(err instanceof Error ? err.stack : err);
    return NextResponse.json(
      { error: "PDF generation failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
