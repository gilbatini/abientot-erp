// Quotation PDF Template — @react-pdf/renderer
// All styles MUST be inline JS objects — no Tailwind
// See SKILL.md for full pdfStyles reference

import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { BRAND } from "@/types/app";

const styles = StyleSheet.create({
  page:      { padding: 48, fontFamily: "Helvetica", backgroundColor: "#ffffff" },
  header:    { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  rule:      { height: 2, backgroundColor: "#2BBFB3", marginBottom: 24 },
  h1:        { fontSize: 22, fontWeight: "bold", color: "#202124" },
  body:      { fontSize: 10, color: "#5f6368", lineHeight: 1.5 },
  label:     { fontSize: 8, color: "#5f6368", textTransform: "uppercase", letterSpacing: 0.5 },
  tableHead: { backgroundColor: "#f1f3f4", flexDirection: "row", padding: "6 8" },
  tableRow:  { flexDirection: "row", padding: "6 8", borderBottomWidth: 1, borderBottomColor: "#e8eaed" },
  totalRow:  { flexDirection: "row", padding: "8 8", backgroundColor: "#e6f9f8" },
});

// Replace 'any' with typed props from src/types/database.ts once generated
export function QuotationPDF({ data }: { data: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: "#202124" }}>{BRAND.name}</Text>
            <Text style={styles.body}>{BRAND.tagline}</Text>
            <Text style={styles.body}>{BRAND.address}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#2BBFB3" }}>Quotation</Text>
            <Text style={styles.body}>{data?.number ?? data?.invoice_number ?? ""}</Text>
            <Text style={styles.body}>Issued: {data?.issue_date ?? ""}</Text>
          </View>
        </View>
        <View style={styles.rule} />
        {/* TODO: Add bill-to block, line items table, totals, notes, terms */}
        <Text style={styles.body}>Build out full document body here.</Text>
      </Page>
    </Document>
  );
}
