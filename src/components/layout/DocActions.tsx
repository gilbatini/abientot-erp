"use client";

import { useState } from "react";
import { sendInvoiceEmail } from "@/actions/email";
import { sendQuotationEmail } from "@/actions/email";
import { sendReceiptEmail } from "@/actions/email";

type DocType = "invoice" | "quotation" | "receipt";

interface DocActionsProps {
  docId:          string;
  docNumber:      string;
  docType:        DocType;
  travellerEmail: string | null;
}

const PDF_ROUTE: Record<DocType, (id: string) => string> = {
  invoice:   (id) => `/api/pdf/invoice/${id}`,
  quotation: (id) => `/api/pdf/quotation/${id}`,
  receipt:   (id) => `/api/pdf/receipt/${id}`,
};

export function DocActions({ docId, docNumber, docType, travellerEmail }: DocActionsProps) {
  const [pdfLoading,  setPdfLoading]  = useState(false);
  const [mailLoading, setMailLoading] = useState(false);
  const [mailSent,    setMailSent]    = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  async function handleDownload() {
    setPdfLoading(true);
    setError(null);
    try {
      const res = await fetch(PDF_ROUTE[docType](docId));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${docNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("PDF generation failed. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleSendEmail() {
    if (!travellerEmail) {
      setError("No email address on file for this traveller.");
      return;
    }
    setMailLoading(true);
    setError(null);
    try {
      if (docType === "invoice")        await sendInvoiceEmail(docId, travellerEmail);
      else if (docType === "quotation") await sendQuotationEmail(docId, travellerEmail);
      else                              await sendReceiptEmail(docId, travellerEmail);
      setMailSent(true);
    } catch {
      setError("Email sending failed. Please try again.");
    } finally {
      setMailLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-red-600 mr-2">{error}</span>
      )}
      <button
        onClick={handleDownload}
        disabled={pdfLoading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pdfLoading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0-3-3m3 3 3-3M3 17v3a1 1 0 001 1h16a1 1 0 001-1v-3" />
            </svg>
            Download PDF
          </>
        )}
      </button>

      <button
        onClick={handleSendEmail}
        disabled={mailLoading || mailSent || !travellerEmail}
        title={!travellerEmail ? "No email address on file for this traveller" : undefined}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {mailLoading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Sending…
          </>
        ) : mailSent ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Email Sent
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send Email
          </>
        )}
      </button>
    </div>
  );
}
