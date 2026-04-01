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

const STATUS_COLOR: Record<string, string> = {
  draft: "#9ca3af", sent: "#2BBFB3", paid: "#16a34a",
  cancelled: "#dc2626", approved: "#16a34a", rejected: "#dc2626", expired: "#d97706",
};
const SVC: Record<string, string> = {
  flight: "FLIGHT BOOKING", airport_transfer: "AIRPORT TRANSFER",
  hotel: "HOTEL RESERVATION", safari_package: "SAFARI PACKAGE",
  glamping: "GLAMPING", bed_breakfast: "BED & BREAKFAST",
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

function buildPdf(quotation: Record<string, unknown>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true, info: {
      Title: `Quotation ${quotation.number}`,
      Author: BRAND_NAME,
    }});

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t     = quotation.travellers as any;
    const items = (quotation.quotation_items ?? []) as Record<string, unknown>[];
    const name  = t ? `${t.first_name} ${t.last_name}` : "—";
    const phone = t?.phone_number
      ? [t.phone_code, t.phone_number].filter(Boolean).join(" ")
      : null;
    const taxAmt   = ((quotation.subtotal as number) - (quotation.discount as number)) * ((quotation.tax_rate as number) / 100);
    const dotColor = STATUS_COLOR[quotation.status as string] ?? TEAL;

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
      .text("QUOTATION", 0, y, { width: rightX, align: "right" });

    doc.font("Helvetica-Bold").fontSize(16).fillColor(TEAL)
      .text(String(quotation.number), 0, y + 36, { width: rightX, align: "right" });

    doc.font("Helvetica").fontSize(9).fillColor(GRAY)
      .text(`Issued: ${fmtDate(quotation.issue_date as string)}`, 0, y + 56, { width: rightX, align: "right" });

    if (quotation.expiry_date) {
      doc.font("Helvetica").fontSize(9).fillColor(GRAY)
        .text("Expires: ", 0, y + 68, { width: rightX - 40, align: "right", continued: true })
        .font("Helvetica-Bold").fillColor(DARK)
        .text(fmtDate(quotation.expiry_date as string));
    }

    const statusY = quotation.expiry_date ? y + 82 : y + 70;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dotTextWidth = (doc as any).widthOfString((quotation.status as string).toUpperCase(), { fontSize: 9 });
    const rowWidth = 10 + dotTextWidth;
    const dotX = PAGE_W - MR - rowWidth;
    doc.circle(dotX + 3.5, statusY + 4.5, 3.5).fill(dotColor);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(dotColor)
      .text((quotation.status as string).toUpperCase(), dotX + 10, statusY, { lineBreak: false });

    y = 120;

    // ── DIVIDER ──────────────────────────────────────────────────────────────
    doc.moveTo(ML, y).lineTo(PAGE_W - MR, y).strokeColor(BORDER_GRAY).lineWidth(1).stroke();
    y += 16;

    // ── QUOTE FOR / CONSULTANT ───────────────────────────────────────────────
    const colW = CONTENT_W * 0.46;

    doc.font("Helvetica-Bold").fontSize(8).fillColor(TEAL)
      .text("QUOTE FOR", ML, y);
    y += 14;
    doc.font("Helvetica-Bold").fontSize(13).fillColor(DARK).text(name, ML, y);
    y += 18;
    if (phone) {
      doc.font("Helvetica").fontSize(9).fillColor(GRAY).text(phone, ML, y);
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

    const consultY = y - 18 - (phone ? 12 : 0) - (t?.country ? 12 : 0) - (t?.email ? 12 : 0) - 14;
    const consultX = ML + colW + CONTENT_W * 0.08;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(TEAL).text("CONSULTANT", consultX, consultY);
    doc.font("Helvetica-Bold").fontSize(13).fillColor(DARK).text("À Bientôt Team", consultX, consultY + 14);
    doc.font("Helvetica").fontSize(9).fillColor(GRAY).text(BRAND_NAME, consultX, consultY + 32);

    y += 12;

    // ── NOTES BANNER ─────────────────────────────────────────────────────────
    if (quotation.notes) {
      doc.rect(ML, y, CONTENT_W, 22).fill(TEAL_LIGHT);
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(TEAL)
        .text(String(quotation.notes), ML + 12, y + 6, { width: CONTENT_W - 24, lineBreak: false });
      y += 30;
    }

    // ── LINE ITEMS TABLE ─────────────────────────────────────────────────────
    const COL = {
      c1: { x: ML,             w: CONTENT_W * 0.28 },
      c2: { x: ML + CONTENT_W * 0.28, w: CONTENT_W * 0.16 },
      c3: { x: ML + CONTENT_W * 0.44, w: CONTENT_W * 0.13 },
      c4: { x: ML + CONTENT_W * 0.57, w: CONTENT_W * 0.07 },
      c5: { x: ML + CONTENT_W * 0.64, w: CONTENT_W * 0.18 },
      c6: { x: ML + CONTENT_W * 0.82, w: CONTENT_W * 0.18 },
    };

    doc.rect(ML, y, CONTENT_W, 22).fill(TEAL_LIGHT);

    const headY = y + 7;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(DARK);
    doc.text("SERVICE",    COL.c1.x + 4, headY, { width: COL.c1.w, lineBreak: false });
    doc.text("TRAVELLER",  COL.c2.x,     headY, { width: COL.c2.w, lineBreak: false });
    doc.text("DATE",       COL.c3.x,     headY, { width: COL.c3.w, lineBreak: false });
    doc.text("PAX",        COL.c4.x,     headY, { width: COL.c4.w, align: "right", lineBreak: false });
    doc.text("UNIT PRICE", COL.c5.x,     headY, { width: COL.c5.w, align: "right", lineBreak: false });
    doc.text("TOTAL",      COL.c6.x,     headY, { width: COL.c6.w, align: "right", lineBreak: false });
    y += 22;

    for (const item of items) {
      const rowH = 36;
      doc.moveTo(ML, y + rowH).lineTo(PAGE_W - MR, y + rowH).strokeColor(BORDER_GRAY).lineWidth(0.5).stroke();

      const rowY = y + 7;
      doc.font("Helvetica-Bold").fontSize(8).fillColor(TEAL)
        .text(SVC[item.type as string] ?? (String(item.type ?? "SERVICE")).toUpperCase(), COL.c1.x + 4, rowY, { width: COL.c1.w - 4, lineBreak: false });
      doc.font("Helvetica").fontSize(8).fillColor(GRAY)
        .text(String(item.description ?? ""), COL.c1.x + 4, rowY + 11, { width: COL.c1.w - 4, lineBreak: false });

      doc.font("Helvetica").fontSize(9).fillColor(DARK)
        .text(String(item.traveller_name ?? "—"), COL.c2.x, rowY, { width: COL.c2.w, lineBreak: false });
      doc.text(item.travel_date ? fmtDate(item.travel_date as string) : "—", COL.c3.x, rowY, { width: COL.c3.w, lineBreak: false });
      doc.text(String(item.quantity), COL.c4.x, rowY, { width: COL.c4.w, align: "right", lineBreak: false });
      doc.text(fmt(item.unit_price as number, item.currency as string), COL.c5.x, rowY, { width: COL.c5.w, align: "right", lineBreak: false });
      doc.text(fmt((item.quantity as number) * (item.unit_price as number), item.currency as string), COL.c6.x, rowY, { width: COL.c6.w, align: "right", lineBreak: false });

      y += rowH;
    }

    y += 10;

    // ── TOTALS ───────────────────────────────────────────────────────────────
    const totX = ML + CONTENT_W * 0.58;
    const totW = CONTENT_W * 0.42;

    doc.font("Helvetica").fontSize(9).fillColor(GRAY)
      .text("Subtotal", totX, y, { width: totW * 0.55, lineBreak: false })
      .fillColor(DARK)
      .text(fmt(quotation.subtotal as number, quotation.currency as string), totX + totW * 0.55, y, { width: totW * 0.45, align: "right", lineBreak: false });
    y += 16;

    if ((quotation.discount as number) > 0) {
      doc.font("Helvetica").fontSize(9).fillColor(GRAY)
        .text("Discount", totX, y, { width: totW * 0.55, lineBreak: false })
        .fillColor("#dc2626")
        .text(`-${fmt(quotation.discount as number, quotation.currency as string)}`, totX + totW * 0.55, y, { width: totW * 0.45, align: "right", lineBreak: false });
      y += 16;
    }

    if ((quotation.tax_rate as number) > 0) {
      doc.font("Helvetica").fontSize(9).fillColor(GRAY)
        .text(`Tax / VAT (${quotation.tax_rate}%)`, totX, y, { width: totW * 0.55, lineBreak: false })
        .fillColor(DARK)
        .text(fmt(taxAmt, quotation.currency as string), totX + totW * 0.55, y, { width: totW * 0.45, align: "right", lineBreak: false });
      y += 16;
    }

    doc.moveTo(totX, y + 4).lineTo(PAGE_W - MR, y + 4).strokeColor(BORDER_GRAY).lineWidth(1.5).stroke();
    y += 12;

    doc.font("Helvetica-Bold").fontSize(11).fillColor(DARK)
      .text("Estimated Total", totX, y, { width: totW * 0.5, lineBreak: false })
      .font("Helvetica-Bold").fontSize(16).fillColor(TEAL)
      .text(fmt(quotation.total as number, quotation.currency as string), totX + totW * 0.5, y - 3, { width: totW * 0.5, align: "right", lineBreak: false });
    y += 28;

    // ── TERMS ────────────────────────────────────────────────────────────────
    if (quotation.terms) {
      doc.font("Helvetica-Bold").fontSize(8).fillColor(TEAL).text("TERMS & CONDITIONS", ML, y);
      doc.font("Helvetica").fontSize(8.5).fillColor(GRAY)
        .text(String(quotation.terms), ML, y + 14, { width: CONTENT_W / 2 - 8, lineGap: 4 });
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
    const buffer = await buildPdf(data as Record<string, unknown>);
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
