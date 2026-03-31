"use server";

import { sendEmail } from "@/lib/email/sender";
import { InvoiceEmail } from "@/components/emails/InvoiceEmail";
import { ReceiptEmail } from "@/components/emails/ReceiptEmail";
import { createClient } from "@/lib/supabase/server";

export async function sendInvoiceEmail(invoiceId: string, recipientEmail: string) {
  const supabase = await createClient();
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*, invoice_items(*), travellers(*)")
    .eq("id", invoiceId)
    .single();
  if (error) throw new Error(error.message);

  // TODO: Generate PDF once InvoicePDF template is complete
  // const { pdf } = await import("@react-pdf/renderer");
  // const { InvoicePDF } = await import("@/components/documents/InvoicePDF");
  // const blob   = await pdf(<InvoicePDF data={invoice} />).toBlob();
  // const buffer = Buffer.from(await blob.arrayBuffer());
  // const base64 = buffer.toString("base64");

  await sendEmail({
    to:      recipientEmail,
    subject: `Invoice ${invoice.invoice_number} — À Bientôt Tour & Travels`,
    react:   InvoiceEmail({
      invoiceNumber: invoice.invoice_number,
      travellerName: `${invoice.travellers?.first_name} ${invoice.travellers?.last_name}`,
      total:         `${invoice.currency} ${invoice.total}`,
      dueDate:       invoice.due_date ?? "",
    }),
    // attachments: [{ filename: `${invoice.invoice_number}.pdf`, content: base64 }],
  });
}

export async function sendReceiptEmail(receiptId: string, recipientEmail: string) {
  const supabase = await createClient();
  const { data: receipt, error } = await supabase
    .from("receipts")
    .select("*, travellers(*)")
    .eq("id", receiptId)
    .single();
  if (error) throw new Error(error.message);

  await sendEmail({
    to:      recipientEmail,
    subject: `Receipt ${receipt.receipt_number} — À Bientôt Tour & Travels`,
    react:   ReceiptEmail({
      receiptNumber: receipt.receipt_number,
      travellerName: `${receipt.travellers?.first_name} ${receipt.travellers?.last_name}`,
      amountPaid:    `${receipt.currency} ${receipt.amount_paid}`,
      paymentDate:   receipt.payment_date,
    }),
  });
}
