"use server";

import { headers, cookies } from "next/headers";
import { sendEmail } from "@/lib/email/sender";
import { InvoiceEmail } from "@/components/emails/InvoiceEmail";
import { ReceiptEmail } from "@/components/emails/ReceiptEmail";
import { QuotationEmail } from "@/components/emails/QuotationEmail";
import { createClient } from "@/lib/supabase/server";

async function fetchPdf(path: string): Promise<Buffer> {
  const h = await headers();
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ");
  const host = h.get("host") ?? "localhost:3000";
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const res = await fetch(`${proto}://${host}${path}`, {
    headers: { Cookie: cookieHeader },
  });
  if (!res.ok) throw new Error(`PDF fetch failed: ${res.status} ${res.statusText}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function sendInvoiceEmail(invoiceId: string, recipientEmail: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("invoice_number, currency, total, due_date, travellers(first_name, last_name)")
    .eq("id", invoiceId)
    .single();
  if (error) throw new Error(error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoice = data as any;
  const travellerName = invoice.travellers
    ? `${invoice.travellers.first_name} ${invoice.travellers.last_name}`
    : "Guest";

  const pdfBuffer = await fetchPdf(`/api/pdf/invoice/${invoiceId}`);

  await sendEmail({
    to:      recipientEmail,
    subject: `Invoice ${invoice.invoice_number} — À Bientôt Tour & Travels`,
    react:   InvoiceEmail({
      invoiceNumber: invoice.invoice_number,
      travellerName,
      total:   `${invoice.currency} ${invoice.total}`,
      dueDate: invoice.due_date ?? "",
    }),
    attachments: [{ filename: `${invoice.invoice_number}.pdf`, content: pdfBuffer.toString("base64") }],
  });
}

export async function sendQuotationEmail(quotationId: string, recipientEmail: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotations")
    .select("number, currency, total, expiry_date, travellers(first_name, last_name)")
    .eq("id", quotationId)
    .single();
  if (error) throw new Error(error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quotation = data as any;
  const travellerName = quotation.travellers
    ? `${quotation.travellers.first_name} ${quotation.travellers.last_name}`
    : "Guest";

  const pdfBuffer = await fetchPdf(`/api/pdf/quotation/${quotationId}`);

  await sendEmail({
    to:      recipientEmail,
    subject: `Quotation ${quotation.number} — À Bientôt Tour & Travels`,
    react:   QuotationEmail({
      quotationNumber: quotation.number,
      travellerName,
      total:      `${quotation.currency} ${quotation.total}`,
      validUntil: quotation.expiry_date ?? "",
    }),
    attachments: [{ filename: `${quotation.number}.pdf`, content: pdfBuffer.toString("base64") }],
  });
}

export async function sendProformaEmail(proformaId: string, recipientEmail: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proformas")
    .select("number, currency, total, expiry_date, travellers(first_name, last_name)")
    .eq("id", proformaId)
    .single();
  if (error) throw new Error(error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proforma = data as any;
  const travellerName = proforma.travellers
    ? `${proforma.travellers.first_name} ${proforma.travellers.last_name}`
    : "Guest";

  const pdfBuffer = await fetchPdf(`/api/pdf/proforma/${proformaId}`);

  await sendEmail({
    to:      recipientEmail,
    subject: `Proforma ${proforma.number} — À Bientôt Tour & Travels`,
    react:   QuotationEmail({
      quotationNumber: proforma.number,
      travellerName,
      total:      `${proforma.currency} ${proforma.total}`,
      validUntil: proforma.expiry_date ?? "",
    }),
    attachments: [{ filename: `${proforma.number}.pdf`, content: pdfBuffer.toString("base64") }],
  });
}

export async function sendReceiptEmail(receiptId: string, recipientEmail: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("receipts")
    .select("receipt_number, currency, amount_paid, payment_date, travellers(first_name, last_name)")
    .eq("id", receiptId)
    .single();
  if (error) throw new Error(error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const receipt = data as any;
  const travellerName = receipt.travellers
    ? `${receipt.travellers.first_name} ${receipt.travellers.last_name}`
    : "Guest";

  const pdfBuffer = await fetchPdf(`/api/pdf/receipt/${receiptId}`);

  await sendEmail({
    to:      recipientEmail,
    subject: `Receipt ${receipt.receipt_number} — À Bientôt Tour & Travels`,
    react:   ReceiptEmail({
      receiptNumber: receipt.receipt_number,
      travellerName,
      amountPaid:  `${receipt.currency} ${receipt.amount_paid}`,
      paymentDate: receipt.payment_date,
    }),
    attachments: [{ filename: `${receipt.receipt_number}.pdf`, content: pdfBuffer.toString("base64") }],
  });
}
