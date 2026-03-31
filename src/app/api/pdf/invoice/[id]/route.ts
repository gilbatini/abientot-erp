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

const STATUS_DOT: Record<string, string> = {
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

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page:          { paddingTop: 40, paddingHorizontal: 48, paddingBottom: 60,
                   fontFamily: "Helvetica", backgroundColor: "#ffffff" },
  header:        { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  hLeft:         { flexDirection: "column" },
  hRight:        { alignItems: "flex-end" },
  docType:       { fontFamily: "Helvetica-Bold", fontSize: 30, color: DARK, marginBottom: 2 },
  docNumber:     { fontFamily: "Helvetica-Bold", fontSize: 16, color: TEAL, marginBottom: 3 },
  metaLine:      { fontSize: 9, color: GRAY, marginBottom: 2 },
  metaBold:      { fontFamily: "Helvetica-Bold", fontSize: 9, color: DARK },
  statusRow:     { flexDirection: "row", alignItems: "center", marginTop: 3 },
  statusDot:     { width: 7, height: 7, borderRadius: 4, marginRight: 4 },
  statusText:    { fontFamily: "Helvetica-Bold", fontSize: 9, textTransform: "uppercase" },
  coName:        { fontFamily: "Helvetica-Bold", fontSize: 14, color: DARK, marginBottom: 6 },
  coDetail:      { fontSize: 8, color: GRAY, marginBottom: 1 },
  rule:          { height: 1, backgroundColor: "#d1d5db", marginBottom: 16 },
  infoBlock:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  infoCol:       { width: "46%" },
  infoLabel:     { fontFamily: "Helvetica-Bold", fontSize: 8, color: TEAL,
                   textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 },
  infoName:      { fontFamily: "Helvetica-Bold", fontSize: 14, color: DARK, marginBottom: 3 },
  infoDetail:    { fontSize: 9, color: GRAY, marginBottom: 1 },
  tHead:         { flexDirection: "row", backgroundColor: TEAL_LIGHT,
                   paddingVertical: 6, paddingHorizontal: 8, borderRadius: 3 },
  tRow:          { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8,
                   borderBottomWidth: 1, borderBottomColor: BORDER },
  tHeadCell:     { fontFamily: "Helvetica-Bold", fontSize: 8, color: DARK,
                   textTransform: "uppercase", letterSpacing: 0.4 },
  tSvcLabel:     { fontFamily: "Helvetica-Bold", fontSize: 8, color: TEAL,
                   textTransform: "uppercase", marginBottom: 2 },
  tDesc:         { fontSize: 8.5, color: GRAY },
  tCell:         { fontSize: 9, color: DARK },
  c1:            { width: "28%" },
  c2:            { width: "16%" },
  c3:            { width: "13%" },
  c4:            { width: "7%",  textAlign: "right" },
  c5:            { width: "18%", textAlign: "right" },
  c6:            { width: "18%", textAlign: "right" },
  totals:        { alignSelf: "flex-end", width: "42%", marginTop: 6, marginBottom: 20 },
  totRow:        { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totLabel:      { fontSize: 9, color: GRAY },
  totValue:      { fontSize: 9, color: DARK },
  totGrandRow:   { flexDirection: "row", justifyContent: "space-between",
                   paddingTop: 7, borderTopWidth: 1.5, borderTopColor: BORDER, marginTop: 4 },
  totGrandLabel: { fontFamily: "Helvetica-Bold", fontSize: 11, color: DARK },
  totGrandAmt:   { fontFamily: "Helvetica-Bold", fontSize: 16, color: TEAL },
  bottom:        { flexDirection: "row", marginTop: 14 },
  bottomCol:     { flex: 1, marginRight: 16 },
  bottomLabel:   { fontFamily: "Helvetica-Bold", fontSize: 8, color: TEAL,
                   textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 },
  bottomText:    { fontSize: 8.5, color: GRAY, lineHeight: 1.55 },
  footer:        { position: "absolute", bottom: 20, left: 48, right: 48,
                   borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 7 },
  footerText:    { fontSize: 7.5, color: "#9ca3af", textAlign: "center" },
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

    console.log("[pdf/invoice] fetching invoice", id);
    const { data, error } = await supabase
      .from("invoices")
      .select("*, travellers(first_name, last_name, email, country, phone_number, phone_code), invoice_items(*)")
      .eq("id", id)
      .single();
    if (error || !data) {
      console.error("[pdf/invoice] supabase error:", error);
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice  = data as any;
    const t        = invoice.travellers;
    const name     = t ? `${t.first_name} ${t.last_name}` : "—";
    const phone    = t?.phone_number
      ? [t.phone_code, t.phone_number].filter(Boolean).join(" ")
      : null;
    const items    = (invoice.invoice_items ?? []) as any[];
    const taxAmt   = (invoice.subtotal - invoice.discount) * (invoice.tax_rate / 100);
    const dotColor = STATUS_DOT[invoice.status] ?? TEAL;

    console.log("[pdf/invoice] building PDF for", invoice.invoice_number);

    const doc = ce(Document, { title: `Invoice ${invoice.invoice_number}`, author: BRAND_NAME },
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
            ce(Text, { style: s.docType }, "INVOICE"),
            ce(Text, { style: s.docNumber }, invoice.invoice_number),
            ce(Text, { style: s.metaLine }, `Issued: ${fmtDate(invoice.issue_date)}`),
            invoice.due_date
              ? ce(Text, { style: s.metaLine },
                  "Due: ",
                  ce(Text, { style: s.metaBold }, fmtDate(invoice.due_date)),
                )
              : null,
            ce(View, { style: s.statusRow },
              ce(View, { style: { ...s.statusDot, backgroundColor: dotColor } }),
              ce(Text, { style: { ...s.statusText, color: dotColor } }, invoice.status.toUpperCase()),
            ),
          ),
        ),

        // ── RULE ──
        ce(View, { style: s.rule }),

        // ── BILL TO / CONSULTANT ──
        ce(View, { style: s.infoBlock },
          ce(View, { style: s.infoCol },
            ce(Text, { style: s.infoLabel }, "Bill To"),
            ce(Text, { style: s.infoName }, name),
            phone      ? ce(Text, { style: s.infoDetail }, phone)     : null,
            t?.country ? ce(Text, { style: s.infoDetail }, t.country) : null,
            t?.email   ? ce(Text, { style: s.infoDetail }, t.email)   : null,
          ),
          ce(View, { style: s.infoCol },
            ce(Text, { style: s.infoLabel }, "Consultant"),
            ce(Text, { style: s.infoName }, "À Bientôt Team"),
            ce(Text, { style: s.infoDetail }, BRAND_NAME),
          ),
        ),

        // ── LINE ITEMS TABLE ──
        ce(View, { style: { marginBottom: 4 } },
          ce(View, { style: s.tHead },
            ce(Text, { style: { ...s.tHeadCell, ...s.c1 } }, "Service"),
            ce(Text, { style: { ...s.tHeadCell, ...s.c2 } }, "Traveller"),
            ce(Text, { style: { ...s.tHeadCell, ...s.c3 } }, "Date"),
            ce(Text, { style: { ...s.tHeadCell, ...s.c4 } }, "Pax"),
            ce(Text, { style: { ...s.tHeadCell, ...s.c5 } }, "Unit Price"),
            ce(Text, { style: { ...s.tHeadCell, ...s.c6 } }, "Total"),
          ),
          ...items.map((item: any, i: number) =>
            ce(View, { key: i, style: s.tRow },
              ce(View, { style: s.c1 },
                ce(Text, { style: s.tSvcLabel },
                  SVC[item.type ?? ""] ?? (item.type ?? "SERVICE").toUpperCase(),
                ),
                ce(Text, { style: s.tDesc }, item.description ?? ""),
              ),
              ce(Text, { style: { ...s.tCell, ...s.c2 } }, item.traveller_name ?? "—"),
              ce(Text, { style: { ...s.tCell, ...s.c3 } },
                item.travel_date ? fmtDate(item.travel_date) : "—",
              ),
              ce(Text, { style: { ...s.tCell, ...s.c4 } }, String(item.quantity)),
              ce(Text, { style: { ...s.tCell, ...s.c5 } }, fmt(item.unit_price, item.currency)),
              ce(Text, { style: { ...s.tCell, ...s.c6 } },
                fmt(item.quantity * item.unit_price, item.currency),
              ),
            )
          ),
        ),

        // ── TOTALS ──
        ce(View, { style: s.totals },
          ce(View, { style: s.totRow },
            ce(Text, { style: s.totLabel }, "Subtotal"),
            ce(Text, { style: s.totValue }, fmt(invoice.subtotal, invoice.currency)),
          ),
          invoice.discount > 0
            ? ce(View, { style: s.totRow },
                ce(Text, { style: s.totLabel }, "Discount"),
                ce(Text, { style: { ...s.totValue, color: "#dc2626" } },
                  `-${fmt(invoice.discount, invoice.currency)}`,
                ),
              )
            : null,
          invoice.tax_rate > 0
            ? ce(View, { style: s.totRow },
                ce(Text, { style: s.totLabel }, `Tax / VAT (${invoice.tax_rate}%)`),
                ce(Text, { style: s.totValue }, fmt(taxAmt, invoice.currency)),
              )
            : null,
          ce(View, { style: s.totGrandRow },
            ce(Text, { style: s.totGrandLabel }, "Total"),
            ce(Text, { style: s.totGrandAmt }, fmt(invoice.total, invoice.currency)),
          ),
        ),

        // ── NOTES + TERMS ──
        invoice.notes || invoice.terms
          ? ce(View, { style: s.bottom },
              invoice.notes
                ? ce(View, { style: s.bottomCol },
                    ce(Text, { style: s.bottomLabel }, "Notes"),
                    ce(Text, { style: s.bottomText }, invoice.notes),
                  )
                : null,
              invoice.terms
                ? ce(View, { style: s.bottomCol },
                    ce(Text, { style: s.bottomLabel }, "Terms & Conditions"),
                    ce(Text, { style: s.bottomText }, invoice.terms),
                  )
                : null,
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
    console.log("[pdf/invoice] PDF rendered, size:", buffer.length, "bytes");

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[pdf/invoice] FATAL ERROR:");
    console.error(err instanceof Error ? err.stack : err);
    return NextResponse.json(
      { error: "PDF generation failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
