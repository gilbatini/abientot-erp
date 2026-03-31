"use server";

import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { sendEmail } from "@/lib/email/sender";
import { InvoiceEmail } from "@/components/emails/InvoiceEmail";
import { ReceiptEmail } from "@/components/emails/ReceiptEmail";
import { QuotationEmail } from "@/components/emails/QuotationEmail";
import { InvoicePDF } from "@/components/documents/InvoicePDF";
import { QuotationPDF } from "@/components/documents/QuotationPDF";
import { ReceiptPDF } from "@/components/documents/ReceiptPDF";
import { createClient } from "@/lib/supabase/server";

export async function sendInvoiceEmail(invoiceId: string, recipientEmail: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, invoice_items(*), travellers(first_name, last_name, email, country)")
    .eq("id", invoiceId)
    .single();
  if (error) throw new Error(error.message);

  const invoice = data as Parameters<typeof InvoicePDF>[0]["invoice"] & {
    invoice_number: string;
    currency: string;
    total: number;
    due_date: string | null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(React.createElement(InvoicePDF, { invoice }) as any);
  const travellerName = invoice.travellers
    ? `${invoice.travellers.first_name} ${invoice.travellers.last_name}`
    : "Guest";

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
    .select("*, quotation_items(*), travellers(first_name, last_name, email, country)")
    .eq("id", quotationId)
    .single();
  if (error) throw new Error(error.message);

  const quotation = data as Parameters<typeof QuotationPDF>[0]["quotation"] & {
    number: string;
    currency: string;
    total: number;
    expiry_date: string | null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(React.createElement(QuotationPDF, { quotation }) as any);
  const travellerName = quotation.travellers
    ? `${quotation.travellers.first_name} ${quotation.travellers.last_name}`
    : "Guest";

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

export async function sendReceiptEmail(receiptId: string, recipientEmail: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("receipts")
    .select("*, travellers(first_name, last_name, email, country), invoices(invoice_number)")
    .eq("id", receiptId)
    .single();
  if (error) throw new Error(error.message);

  const receipt = data as Parameters<typeof ReceiptPDF>[0]["receipt"] & {
    receipt_number: string;
    currency: string;
    amount_paid: number;
    payment_date: string;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(React.createElement(ReceiptPDF, { receipt }) as any);
  const travellerName = receipt.travellers
    ? `${receipt.travellers.first_name} ${receipt.travellers.last_name}`
    : "Guest";

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
