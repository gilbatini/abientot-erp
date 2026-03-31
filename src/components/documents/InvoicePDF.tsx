// Invoice PDF Template — @react-pdf/renderer
// All styles MUST be inline JS objects — no Tailwind

import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { BRAND } from "@/types/app";
import type { Database } from "@/types/database";

type InvoiceRow   = Database["public"]["Tables"]["invoices"]["Row"];
type ItemRow      = Database["public"]["Tables"]["invoice_items"]["Row"];
type TravellerRow = Database["public"]["Tables"]["travellers"]["Row"];

export type InvoicePDFProps = {
  invoice: InvoiceRow & {
    travellers: Pick<
      TravellerRow,
      "first_name" | "last_name" | "email" | "country" | "phone_number" | "phone_code"
    > | null;
    invoice_items: ItemRow[];
  };
  /** Absolute path to logo.png on the server — optional */
  logoSrc?: string;
  agentName?: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────
const TEAL        = "#2BBFB3";
const DARK        = "#1a1a1a";
const GRAY        = "#6b7280";
const BORDER      = "#e5e7eb";
const TEAL_LIGHT  = "#e6f9f8";

const STATUS_DOT: Record<string, string> = {
  draft:     "#9ca3af",
  sent:      "#2BBFB3",
  paid:      "#16a34a",
  cancelled: "#dc2626",
  approved:  "#16a34a",
  rejected:  "#dc2626",
  expired:   "#d97706",
};

const SVC: Record<string, string> = {
  flight:           "FLIGHT BOOKING",
  airport_transfer: "AIRPORT TRANSFER",
  hotel:            "HOTEL RESERVATION",
  safari_package:   "SAFARI PACKAGE",
  glamping:         "GLAMPING",
  bed_breakfast:    "BED & BREAKFAST",
};

function fmt(amount: number, currency: string): string {
  const SYM: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", UGX: "UGX ", KES: "KSh ",
    TZS: "TSh ", RWF: "RWF ", AED: "AED ", CAD: "C$", ZAR: "R",
  };
  const NO_DEC = ["UGX", "KES", "TZS", "RWF"];
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

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page:         { paddingTop: 40, paddingHorizontal: 48, paddingBottom: 60,
                  fontFamily: "Helvetica", backgroundColor: "#ffffff" },

  // Header
  header:       { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  hLeft:        { flexDirection: "column" },
  hRight:       { alignItems: "flex-end" },
  docType:      { fontFamily: "Helvetica-Bold", fontSize: 30, color: DARK, marginBottom: 2 },
  docNumber:    { fontFamily: "Helvetica-Bold", fontSize: 16, color: TEAL, marginBottom: 3 },
  metaLine:     { fontSize: 9, color: GRAY, marginBottom: 2 },
  metaBold:     { fontFamily: "Helvetica-Bold", fontSize: 9, color: DARK },
  statusRow:    { flexDirection: "row", alignItems: "center", marginTop: 3 },
  statusDot:    { width: 7, height: 7, borderRadius: 4, marginRight: 4 },
  statusText:   { fontFamily: "Helvetica-Bold", fontSize: 9, textTransform: "uppercase" },
  coName:       { fontFamily: "Helvetica-Bold", fontSize: 12, color: DARK, marginBottom: 4 },
  coDetail:     { fontSize: 8, color: GRAY, marginBottom: 1 },

  // Rule
  rule:         { height: 1, backgroundColor: "#d1d5db", marginBottom: 16 },

  // Info block
  infoBlock:    { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  infoCol:      { width: "46%" },
  infoLabel:    { fontFamily: "Helvetica-Bold", fontSize: 8, color: TEAL,
                  textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 },
  infoName:     { fontFamily: "Helvetica-Bold", fontSize: 14, color: DARK, marginBottom: 3 },
  infoDetail:   { fontSize: 9, color: GRAY, marginBottom: 1 },

  // Table
  tHead:        { flexDirection: "row", backgroundColor: TEAL_LIGHT,
                  paddingVertical: 6, paddingHorizontal: 8, borderRadius: 3 },
  tRow:         { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8,
                  borderBottomWidth: 1, borderBottomColor: BORDER },
  tHeadCell:    { fontFamily: "Helvetica-Bold", fontSize: 8, color: DARK,
                  textTransform: "uppercase", letterSpacing: 0.4 },
  tSvcLabel:    { fontFamily: "Helvetica-Bold", fontSize: 8, color: TEAL,
                  textTransform: "uppercase", marginBottom: 2 },
  tDesc:        { fontSize: 8.5, color: GRAY },
  tCell:        { fontSize: 9, color: DARK },
  // Column widths
  c1:           { width: "28%" },
  c2:           { width: "16%" },
  c3:           { width: "13%" },
  c4:           { width: "7%",  textAlign: "right" },
  c5:           { width: "18%", textAlign: "right" },
  c6:           { width: "18%", textAlign: "right" },

  // Totals
  totals:       { alignSelf: "flex-end", width: "42%", marginTop: 6, marginBottom: 20 },
  totRow:       { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totLabel:     { fontSize: 9, color: GRAY },
  totValue:     { fontSize: 9, color: DARK },
  totGrandRow:  { flexDirection: "row", justifyContent: "space-between",
                  paddingTop: 7, borderTopWidth: 1.5, borderTopColor: BORDER, marginTop: 4 },
  totGrandLabel:{ fontFamily: "Helvetica-Bold", fontSize: 11, color: DARK },
  totGrandAmt:  { fontFamily: "Helvetica-Bold", fontSize: 16, color: TEAL },

  // Bottom notes + terms (two columns)
  bottom:       { flexDirection: "row", marginTop: 14 },
  bottomCol:    { flex: 1, marginRight: 16 },
  bottomLabel:  { fontFamily: "Helvetica-Bold", fontSize: 8, color: TEAL,
                  textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 },
  bottomText:   { fontSize: 8.5, color: GRAY, lineHeight: 1.55 },

  // Fixed footer bar
  footer:       { position: "absolute", bottom: 20, left: 48, right: 48,
                  borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 7 },
  footerText:   { fontSize: 7.5, color: "#9ca3af", textAlign: "center" },
});

// ─── Component ───────────────────────────────────────────────────────────────
export function InvoicePDF({ invoice, logoSrc, agentName = "À Bientôt Team" }: InvoicePDFProps) {
  const t    = invoice.travellers;
  const name = t ? `${t.first_name} ${t.last_name}` : "—";
  const phone = t?.phone_number
    ? [t.phone_code, t.phone_number].filter(Boolean).join(" ")
    : null;
  const items   = invoice.invoice_items ?? [];
  const taxAmt  = (invoice.subtotal - invoice.discount) * (invoice.tax_rate / 100);
  const dotColor = STATUS_DOT[invoice.status] ?? TEAL;

  return (
    <Document title={`Invoice ${invoice.invoice_number}`} author={BRAND.name}>
      <Page size="A4" style={s.page}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          {/* Left: logo / company */}
          <View style={s.hLeft}>
            {logoSrc
              ? <Image src={logoSrc} style={{ width: 160, height: 45, marginBottom: 6 }} />
              : <Text style={[s.coName, { fontSize: 14, marginBottom: 6 }]}>{BRAND.short}</Text>
            }
            <Text style={s.coDetail}>{BRAND.address}</Text>
            <Text style={s.coDetail}>{BRAND.phones[0]} · {BRAND.email}</Text>
          </View>

          {/* Right: doc type / number / dates / status */}
          <View style={s.hRight}>
            <Text style={s.docType}>INVOICE</Text>
            <Text style={s.docNumber}>{invoice.invoice_number}</Text>
            <Text style={s.metaLine}>Issued: {fmtDate(invoice.issue_date)}</Text>
            {invoice.due_date && (
              <Text style={s.metaLine}>
                Due: <Text style={s.metaBold}>{fmtDate(invoice.due_date)}</Text>
              </Text>
            )}
            <View style={s.statusRow}>
              <View style={[s.statusDot, { backgroundColor: dotColor }]} />
              <Text style={[s.statusText, { color: dotColor }]}>{invoice.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* ── RULE ── */}
        <View style={s.rule} />

        {/* ── BILL TO / CONSULTANT ── */}
        <View style={s.infoBlock}>
          <View style={s.infoCol}>
            <Text style={s.infoLabel}>Bill To</Text>
            <Text style={s.infoName}>{name}</Text>
            {phone      && <Text style={s.infoDetail}>{phone}</Text>}
            {t?.country && <Text style={s.infoDetail}>{t.country}</Text>}
            {t?.email   && <Text style={s.infoDetail}>{t.email}</Text>}
          </View>
          <View style={s.infoCol}>
            <Text style={s.infoLabel}>Consultant</Text>
            <Text style={s.infoName}>{agentName}</Text>
            <Text style={s.infoDetail}>{BRAND.name}</Text>
          </View>
        </View>

        {/* ── LINE ITEMS TABLE ── */}
        <View style={{ marginBottom: 4 }}>
          <View style={s.tHead}>
            <Text style={[s.tHeadCell, s.c1]}>Service</Text>
            <Text style={[s.tHeadCell, s.c2]}>Traveller</Text>
            <Text style={[s.tHeadCell, s.c3]}>Date</Text>
            <Text style={[s.tHeadCell, s.c4]}>Pax</Text>
            <Text style={[s.tHeadCell, s.c5]}>Unit Price</Text>
            <Text style={[s.tHeadCell, s.c6]}>Total</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={s.tRow}>
              <View style={s.c1}>
                <Text style={s.tSvcLabel}>
                  {SVC[item.type ?? ""] ?? (item.type ?? "SERVICE").toUpperCase()}
                </Text>
                <Text style={s.tDesc}>{item.description}</Text>
              </View>
              <Text style={[s.tCell, s.c2]}>{item.traveller_name ?? "—"}</Text>
              <Text style={[s.tCell, s.c3]}>{item.travel_date ? fmtDate(item.travel_date) : "—"}</Text>
              <Text style={[s.tCell, s.c4]}>{item.quantity}</Text>
              <Text style={[s.tCell, s.c5]}>{fmt(item.unit_price, item.currency)}</Text>
              <Text style={[s.tCell, s.c6]}>{fmt(item.quantity * item.unit_price, item.currency)}</Text>
            </View>
          ))}
        </View>

        {/* ── TOTALS ── */}
        <View style={s.totals}>
          <View style={s.totRow}>
            <Text style={s.totLabel}>Subtotal</Text>
            <Text style={s.totValue}>{fmt(invoice.subtotal, invoice.currency)}</Text>
          </View>
          {invoice.discount > 0 && (
            <View style={s.totRow}>
              <Text style={s.totLabel}>Discount</Text>
              <Text style={[s.totValue, { color: "#dc2626" }]}>
                -{fmt(invoice.discount, invoice.currency)}
              </Text>
            </View>
          )}
          {invoice.tax_rate > 0 && (
            <View style={s.totRow}>
              <Text style={s.totLabel}>Tax / VAT ({invoice.tax_rate}%)</Text>
              <Text style={s.totValue}>{fmt(taxAmt, invoice.currency)}</Text>
            </View>
          )}
          <View style={s.totGrandRow}>
            <Text style={s.totGrandLabel}>Total</Text>
            <Text style={s.totGrandAmt}>{fmt(invoice.total, invoice.currency)}</Text>
          </View>
        </View>

        {/* ── NOTES + TERMS ── */}
        {(invoice.notes || invoice.terms) && (
          <View style={s.bottom}>
            {invoice.notes && (
              <View style={s.bottomCol}>
                <Text style={s.bottomLabel}>Notes</Text>
                <Text style={s.bottomText}>{invoice.notes}</Text>
              </View>
            )}
            {invoice.terms && (
              <View style={s.bottomCol}>
                <Text style={s.bottomLabel}>Terms & Conditions</Text>
                <Text style={s.bottomText}>{invoice.terms}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── FOOTER BAR (fixed) ── */}
        <View fixed style={s.footer}>
          <Text style={s.footerText}>
            Thank you for choosing {BRAND.name} · {BRAND.tagline} · {BRAND.phones[0]} · {BRAND.email}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
