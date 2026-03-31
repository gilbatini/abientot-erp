"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createReceipt, updateReceipt, type ReceiptWithRefs } from "@/actions/receipts";
import { CURRENCIES, PAYMENT_LABELS } from "@/types/app";
import type { Database } from "@/types/database";

type TravellerRow = Database["public"]["Tables"]["travellers"]["Row"];
type InvoiceRow   = Database["public"]["Tables"]["invoices"]["Row"];

interface Props {
  travellers:  Pick<TravellerRow, "id" | "first_name" | "last_name">[];
  invoices:    Pick<InvoiceRow, "id" | "invoice_number">[];
  initialData?: ReceiptWithRefs;
}

export function ReceiptForm({ travellers, invoices, initialData }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const [travellerId,      setTravellerId]      = useState(initialData?.traveller_id ?? "");
  const [invoiceId,        setInvoiceId]        = useState(initialData?.invoice_id ?? "");
  const [amountPaid,       setAmountPaid]       = useState(initialData?.amount_paid ?? 0);
  const [currency,         setCurrency]         = useState(initialData?.currency ?? "USD");
  const [paymentDate,      setPaymentDate]      = useState(initialData?.payment_date ?? new Date().toISOString().slice(0, 10));
  const [paymentMethod,    setPaymentMethod]    = useState(initialData?.payment_method ?? "");
  const [referenceNumber,  setReferenceNumber]  = useState(initialData?.reference_number ?? "");
  const [notes,            setNotes]            = useState(initialData?.notes ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        traveller_id:     travellerId      || null,
        invoice_id:       invoiceId        || null,
        amount_paid:      amountPaid,
        currency,
        payment_date:     paymentDate,
        payment_method:   paymentMethod    || null,
        reference_number: referenceNumber  || null,
        notes:            notes            || null,
      };
      if (initialData) {
        await updateReceipt(initialData.id, payload);
      } else {
        await createReceipt(payload);
      }
      router.push("/receipts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save receipt");
      setSaving(false);
    }
  }

  const selectClass = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="px-4 py-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Payment Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Traveller</label>
            <select value={travellerId} onChange={e => setTravellerId(e.target.value)} className={selectClass}>
              <option value="">— None —</option>
              {travellers.map(t => (
                <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Invoice</label>
            <select value={invoiceId} onChange={e => setInvoiceId(e.target.value)} className={selectClass}>
              <option value="">— None —</option>
              {invoices.map(inv => (
                <option key={inv.id} value={inv.id}>{inv.invoice_number}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={selectClass}>
              <option value="">— Select —</option>
              {(Object.entries(PAYMENT_LABELS) as [string, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <Input
            label="Amount Paid"
            type="number"
            min="0"
            step="0.01"
            value={amountPaid}
            onChange={e => setAmountPaid(Number(e.target.value))}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className={selectClass}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input
            label="Payment Date"
            type="date"
            value={paymentDate}
            onChange={e => setPaymentDate(e.target.value)}
            required
          />
          <Input
            label="Reference Number"
            type="text"
            value={referenceNumber}
            onChange={e => setReferenceNumber(e.target.value)}
            placeholder="e.g. bank ref, mobile money code"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Internal notes..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="secondary" onClick={() => router.push("/receipts")}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : initialData ? "Update Receipt" : "Create Receipt"}</Button>
      </div>
    </form>
  );
}
