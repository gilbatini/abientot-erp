import React from "react";
import { existsSync } from "fs";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";
import {
  renderToBuffer, Document, Page, View, Text, Image, StyleSheet,
} from "@react-pdf/renderer";
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
const TEAL       = "#2BBFB3";
const DARK       = "#1a1a1a";
const GRAY       = "#6b7280";
const BORDER     = "#e5e7eb";
const TEAL_LIGHT = "#e6f9f8";

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

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page:         { paddingTop: 40, paddingHorizontal: 48, paddingBottom: 60,
                  fontFamily: "Helvetica", backgroundColor: "#ffffff" },
  header:       { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  hLeft:        { flexDirection: "column" },
  hRight:       { alignItems: "flex-end" },
  docType:      { fontFamily: "Helvetica-Bold", fontSize: 30, color: DARK, marginBottom: 2 },
  docNumber:    { fontFamily: "Helvetica-Bold", fontSize: 16, color: TEAL, marginBottom: 3 },
  metaLine:     { fontSize: 9, color: GRAY, marginBottom: 2 },
  metaBold:     { fontFamily: "Helvetica-Bold", fontSize: 9, color: DARK },
  coName:       { fontFamily: "Helvetica-Bold", fontSize: 14, color: DARK, marginBottom: 6 },
  coDetail:     { fontSize: 8, color: GRAY, marginBottom: 1 },
  rule:         { height: 1, backgroundColor: "#d1d5db", marginBottom: 16 },
  infoBlock:    { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  infoCol:      { width: "46%" },
  infoLabel:    { fontFamily: "Helvetica-Bold", fontSize: 8, color: TEAL,
                  textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 },
  infoName:     { fontFamily: "Helvetica-Bold", fontSize: 14, color: DARK, marginBottom: 3 },
  infoDetail:   { fontSize: 9, color: GRAY, marginBottom: 1 },
  amountBlock:  { backgroundColor: TEAL_LIGHT, borderRadius: 6,
                  paddingVertical: 16, paddingHorizontal: 20, marginBottom: 20 },
  amountLabel:  { fontFamily: "Helvetica-Bold", fontSize: 8, color: TEAL,
                  textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  amountValue:  { fontFamily: "Helvetica-Bold", fontSize: 30, color: DARK },
  card:         { backgroundColor: "#f9fafb", borderRadius: 6,
                  paddingVertical: 12, paddingHorizontal: 16, marginBottom: 20 },
  cardRow:      { flexDirection: "row", justifyContent: "space-between",
                  paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: BORDER },
  cardRowLast:  { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  cardLabel:    { fontSize: 8.5, color: GRAY },
  cardValue:    { fontFamily: "Helvetica-Bold", fontSize: 8.5, color: DARK },
  bottom:       { flexDirection: "row", marginTop: 14 },
  bottomCol:    { flex: 1, marginRight: 16 },
  bottomLabel:  { fontFamily: "Helvetica-Bold", fontSize: 8, color: TEAL,
                  textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 },
  bottomText:   { fontSize: 8.5, color: GRAY, lineHeight: 1.55 },
  footer:       { position: "absolute", bottom: 20, left: 48, right: 48,
                  borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 7 },
  footerText:   { fontSize: 7.5, color: "#9ca3af", textAlign: "center" },
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ce = React.createElement;

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const receipt  = data as any;
    const t        = receipt.travellers;
    const name     = t ? `${t.first_name} ${t.last_name}` : "—";
    const phone    = t?.phone_number
      ? [t.phone_code, t.phone_number].filter(Boolean).join(" ")
      : null;
    const payLabel = PAYMENT_LABELS[receipt.payment_method ?? ""] ?? (receipt.payment_method ?? "—");
    const invNum   = receipt.invoices?.invoice_number ?? null;

    console.log("[pdf/receipt] building PDF for", receipt.receipt_number);

    const doc = ce(Document, { title: `Receipt ${receipt.receipt_number}`, author: BRAND_NAME },
      ce(Page, { size: "A4", style: s.page },

        // ── HEADER ──
        ce(View, { style: s.header },
          ce(View, { style: s.hLeft },
            logoSrc
              ? ce(Image, { src: logoSrc, style: { width: 160, height: 45, marginBottom: 6 } })
              : ce(Text, { style: s.coName }, BRAND_SHORT),
            ce(Text, { style: s.coDetail }, BRAND_ADDRESS),
            ce(Text, { style: s.coDetail }, `${BRAND_PHONE} · ${BRAND_EMAIL}`),
          ),
          ce(View, { style: s.hRight },
            ce(Text, { style: s.docType }, "RECEIPT"),
            ce(Text, { style: s.docNumber }, receipt.receipt_number),
            ce(Text, { style: s.metaLine },
              "Payment Date: ",
              ce(Text, { style: s.metaBold }, fmtDate(receipt.payment_date)),
            ),
            invNum
              ? ce(Text, { style: s.metaLine },
                  "Invoice: ",
                  ce(Text, { style: s.metaBold }, invNum),
                )
              : null,
          ),
        ),

        // ── RULE ──
        ce(View, { style: s.rule }),

        // ── RECEIPT FOR / RECEIVED BY ──
        ce(View, { style: s.infoBlock },
          ce(View, { style: s.infoCol },
            ce(Text, { style: s.infoLabel }, "Receipt For"),
            ce(Text, { style: s.infoName }, name),
            phone      ? ce(Text, { style: s.infoDetail }, phone)     : null,
            t?.country ? ce(Text, { style: s.infoDetail }, t.country) : null,
            t?.email   ? ce(Text, { style: s.infoDetail }, t.email)   : null,
          ),
          ce(View, { style: s.infoCol },
            ce(Text, { style: s.infoLabel }, "Received By"),
            ce(Text, { style: s.infoName }, "À Bientôt Team"),
            ce(Text, { style: s.infoDetail }, BRAND_NAME),
          ),
        ),

        // ── AMOUNT PAID ──
        ce(View, { style: s.amountBlock },
          ce(Text, { style: s.amountLabel }, "Amount Paid"),
          ce(Text, { style: s.amountValue }, fmt(receipt.amount_paid, receipt.currency)),
        ),

        // ── PAYMENT DETAILS CARD ──
        ce(View, { style: s.card },
          ce(View, { style: s.cardRow },
            ce(Text, { style: s.cardLabel }, "Payment Method"),
            ce(Text, { style: s.cardValue }, payLabel),
          ),
          ce(View, { style: s.cardRow },
            ce(Text, { style: s.cardLabel }, "Payment Date"),
            ce(Text, { style: s.cardValue }, fmtDate(receipt.payment_date)),
          ),
          receipt.reference_number
            ? ce(View, { style: s.cardRow },
                ce(Text, { style: s.cardLabel }, "Reference Number"),
                ce(Text, { style: s.cardValue }, receipt.reference_number),
              )
            : null,
          invNum
            ? ce(View, { style: s.cardRowLast },
                ce(Text, { style: s.cardLabel }, "Invoice Reference"),
                ce(Text, { style: s.cardValue }, invNum),
              )
            : ce(View, { style: s.cardRowLast }),
        ),

        // ── NOTES ──
        receipt.notes
          ? ce(View, { style: s.bottom },
              ce(View, { style: { ...s.bottomCol, marginRight: 0 } },
                ce(Text, { style: s.bottomLabel }, "Notes"),
                ce(Text, { style: s.bottomText }, receipt.notes),
              ),
            )
          : null,

        // ── FOOTER ──
        ce(View, { fixed: true, style: s.footer },
          ce(Text, { style: s.footerText },
            `Thank you for choosing ${BRAND_NAME} · ${BRAND_TAGLINE} · ${BRAND_PHONE} · ${BRAND_EMAIL}`,
          ),
        ),
      ),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(doc as any);
    console.log("[pdf/receipt] PDF rendered, size:", buffer.length, "bytes");

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${receipt.receipt_number}.pdf"`,
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
