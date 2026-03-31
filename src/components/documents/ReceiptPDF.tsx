// Receipt PDF Template — @react-pdf/renderer
// All styles MUST be inline JS objects — no Tailwind

import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { BRAND } from "@/types/app";
import type { Database } from "@/types/database";

type ReceiptRow   = Database["public"]["Tables"]["receipts"]["Row"];
type TravellerRow = Database["public"]["Tables"]["travellers"]["Row"];
type InvoiceRow   = Database["public"]["Tables"]["invoices"]["Row"];

export type ReceiptPDFProps = {
  receipt: ReceiptRow & {
    travellers: Pick<
      TravellerRow,
      "first_name" | "last_name" | "email" | "country" | "phone_number" | "phone_code"
    > | null;
    invoices: Pick<InvoiceRow, "invoice_number"> | null;
  };
  logoSrc?: string;
  agentName?: string;
};

const TEAL        = "#2BBFB3";
const DARK        = "#1a1a1a";
const GRAY        = "#6b7280";
const BORDER      = "#e5e7eb";
const TEAL_LIGHT  = "#e6f9f8";

const PAYMENT_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  card:          "Card",
  mobile_money:  "Mobile Money",
  cash:          "Cash",
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
  coName:       { fontFamily: "Helvetica-Bold", fontSize: 12, color: DARK, marginBottom: 4 },
  coDetail:     { fontSize: 8, color: GRAY, marginBottom: 1 },

  rule:         { height: 1, backgroundColor: "#d1d5db", marginBottom: 16 },

  infoBlock:    { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  infoCol:      { width: "46%" },
  infoLabel:    { fontFamily: "Helvetica-Bold", fontSize: 8, color: TEAL,
                  textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 },
  infoName:     { fontFamily: "Helvetica-Bold", fontSize: 14, color: DARK, marginBottom: 3 },
  infoDetail:   { fontSize: 9, color: GRAY, marginBottom: 1 },

  // Payment details card
  card:         { backgroundColor: "#f9fafb", borderRadius: 6,
                  paddingVertical: 12, paddingHorizontal: 16, marginBottom: 20 },
  cardRow:      { flexDirection: "row", justifyContent: "space-between",
                  paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: BORDER },
  cardRowLast:  { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  cardLabel:    { fontSize: 8.5, color: GRAY },
  cardValue:    { fontFamily: "Helvetica-Bold", fontSize: 8.5, color: DARK },

  // Amount paid block
  amountBlock:  { backgroundColor: TEAL_LIGHT, borderRadius: 6,
                  paddingVertical: 16, paddingHorizontal: 20, marginBottom: 20 },
  amountLabel:  { fontFamily: "Helvetica-Bold", fontSize: 8, color: TEAL,
                  textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  amountValue:  { fontFamily: "Helvetica-Bold", fontSize: 30, color: DARK },
  amountCurr:   { fontFamily: "Helvetica-Bold", fontSize: 14, color: TEAL },

  bottom:       { flexDirection: "row", marginTop: 14 },
  bottomCol:    { flex: 1, marginRight: 16 },
  bottomLabel:  { fontFamily: "Helvetica-Bold", fontSize: 8, color: TEAL,
                  textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 },
  bottomText:   { fontSize: 8.5, color: GRAY, lineHeight: 1.55 },

  footer:       { position: "absolute", bottom: 20, left: 48, right: 48,
                  borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 7 },
  footerText:   { fontSize: 7.5, color: "#9ca3af", textAlign: "center" },
});

export function ReceiptPDF({ receipt, logoSrc, agentName = "À Bientôt Team" }: ReceiptPDFProps) {
  const t    = receipt.travellers;
  const name = t ? `${t.first_name} ${t.last_name}` : "—";
  const phone = t?.phone_number
    ? [t.phone_code, t.phone_number].filter(Boolean).join(" ")
    : null;
  const payLabel = PAYMENT_LABELS[receipt.payment_method ?? ""] ?? (receipt.payment_method ?? "—");

  return (
    <Document title={`Receipt ${receipt.receipt_number}`} author={BRAND.name}>
      <Page size="A4" style={s.page}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.hLeft}>
            {logoSrc
              ? <Image src={logoSrc} style={{ width: 160, height: 45, marginBottom: 6 }} />
              : <Text style={[s.coName, { fontSize: 14, marginBottom: 6 }]}>{BRAND.short}</Text>
            }
            <Text style={s.coDetail}>{BRAND.address}</Text>
            <Text style={s.coDetail}>{BRAND.phones[0]} · {BRAND.email}</Text>
          </View>
          <View style={s.hRight}>
            <Text style={s.docType}>RECEIPT</Text>
            <Text style={s.docNumber}>{receipt.receipt_number}</Text>
            <Text style={s.metaLine}>
              Payment Date: <Text style={s.metaBold}>{fmtDate(receipt.payment_date)}</Text>
            </Text>
            {receipt.invoices?.invoice_number && (
              <Text style={s.metaLine}>
                Invoice: <Text style={s.metaBold}>{receipt.invoices.invoice_number}</Text>
              </Text>
            )}
          </View>
        </View>

        {/* ── RULE ── */}
        <View style={s.rule} />

        {/* ── RECEIPT FOR / CONSULTANT ── */}
        <View style={s.infoBlock}>
          <View style={s.infoCol}>
            <Text style={s.infoLabel}>Receipt For</Text>
            <Text style={s.infoName}>{name}</Text>
            {phone      && <Text style={s.infoDetail}>{phone}</Text>}
            {t?.country && <Text style={s.infoDetail}>{t.country}</Text>}
            {t?.email   && <Text style={s.infoDetail}>{t.email}</Text>}
          </View>
          <View style={s.infoCol}>
            <Text style={s.infoLabel}>Received By</Text>
            <Text style={s.infoName}>{agentName}</Text>
            <Text style={s.infoDetail}>{BRAND.name}</Text>
          </View>
        </View>

        {/* ── AMOUNT PAID ── */}
        <View style={s.amountBlock}>
          <Text style={s.amountLabel}>Amount Paid</Text>
          <Text style={s.amountValue}>
            {fmt(receipt.amount_paid, receipt.currency)}
          </Text>
        </View>

        {/* ── PAYMENT DETAILS CARD ── */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.cardLabel}>Payment Method</Text>
            <Text style={s.cardValue}>{payLabel}</Text>
          </View>
          <View style={s.cardRow}>
            <Text style={s.cardLabel}>Payment Date</Text>
            <Text style={s.cardValue}>{fmtDate(receipt.payment_date)}</Text>
          </View>
          {receipt.reference_number && (
            <View style={s.cardRow}>
              <Text style={s.cardLabel}>Reference Number</Text>
              <Text style={s.cardValue}>{receipt.reference_number}</Text>
            </View>
          )}
          {receipt.invoices?.invoice_number && (
            <View style={s.cardRowLast}>
              <Text style={s.cardLabel}>Invoice Reference</Text>
              <Text style={s.cardValue}>{receipt.invoices.invoice_number}</Text>
            </View>
          )}
        </View>

        {/* ── NOTES ── */}
        {receipt.notes && (
          <View style={s.bottom}>
            <View style={[s.bottomCol, { marginRight: 0 }]}>
              <Text style={s.bottomLabel}>Notes</Text>
              <Text style={s.bottomText}>{receipt.notes}</Text>
            </View>
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
