"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createQuotation, updateQuotation, type QuotationItemDraft, type QuotationWithItems } from "@/actions/quotations";
import { CURRENCIES, SERVICE_LABELS, type ServiceType } from "@/types/app";
import type { Database } from "@/types/database";

type TravellerRow = Database["public"]["Tables"]["travellers"]["Row"];

interface Props {
  travellers:  Pick<TravellerRow, "id" | "first_name" | "last_name">[];
  initialData?: QuotationWithItems;
}

const STATUSES = ["draft", "sent", "approved", "rejected", "expired"] as const;

function emptyItem(): QuotationItemDraft {
  return { description: "", quantity: 1, unit_price: 0, currency: "USD", type: null, traveller_name: null, travel_date: null };
}

function calcTotals(items: QuotationItemDraft[], discount: number, taxRate: number) {
  const subtotal   = items.reduce((s, it) => s + (it.quantity ?? 1) * (it.unit_price ?? 0), 0);
  const discounted = subtotal - discount;
  const tax        = discounted * taxRate / 100;
  const total      = discounted + tax;
  return { subtotal, tax, total };
}

export function QuotationForm({ travellers, initialData }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const [travellerId, setTravellerId] = useState(initialData?.traveller_id ?? "");
  const [issueDate,   setIssueDate]   = useState(initialData?.issue_date ?? new Date().toISOString().slice(0, 10));
  const [expiryDate,  setExpiryDate]  = useState(initialData?.expiry_date ?? "");
  const [currency,    setCurrency]    = useState(initialData?.currency ?? "USD");
  const [status,      setStatus]      = useState<string>(initialData?.status ?? "draft");
  const [discount,    setDiscount]    = useState(initialData?.discount ?? 0);
  const [taxRate,     setTaxRate]     = useState(initialData?.tax_rate ?? 0);
  const [notes,       setNotes]       = useState(initialData?.notes ?? "");
  const [terms,       setTerms]       = useState(initialData?.terms ?? "");
  const [items,       setItems]       = useState<QuotationItemDraft[]>(
    initialData?.quotation_items?.length
      ? initialData.quotation_items.map(it => ({
          description:    it.description,
          quantity:       it.quantity,
          unit_price:     it.unit_price,
          currency:       it.currency,
          type:           it.type,
          traveller_name: it.traveller_name,
          travel_date:    it.travel_date,
        }))
      : [emptyItem()]
  );

  const { subtotal, tax, total } = calcTotals(items, discount, taxRate);

  function updateItem<K extends keyof QuotationItemDraft>(idx: number, key: K, val: QuotationItemDraft[K]) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [key]: val } : it));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        traveller_id: travellerId || null,
        issue_date:   issueDate,
        expiry_date:  expiryDate || null,
        currency,
        status,
        discount,
        tax_rate:     taxRate,
        subtotal,
        total,
        notes:        notes || null,
        terms:        terms || null,
      };
      const filledItems = items.filter(it => it.description.trim() !== "");
      if (initialData) {
        await updateQuotation(initialData.id, payload, filledItems);
      } else {
        await createQuotation(payload, filledItems);
      }
      router.push("/quotations");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save quotation");
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
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Details</h2>
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
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className={selectClass}>
              {STATUSES.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className={selectClass}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Input label="Issue Date"  type="date" value={issueDate}  onChange={e => setIssueDate(e.target.value)} required />
          <Input label="Expiry Date" type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
        </div>
      </div>

      {/* Line items */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Line Items</h2>
          <Button type="button" variant="secondary" className="text-xs py-1.5" onClick={() => setItems(p => [...p, emptyItem()])}>
            + Add Item
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Traveller</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 w-36">
                    <select
                      value={item.type ?? ""}
                      onChange={e => updateItem(idx, "type", e.target.value || null)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                    >
                      <option value="">— Type —</option>
                      {(Object.entries(SERVICE_LABELS) as [ServiceType, string][]).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 min-w-48">
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => updateItem(idx, "description", e.target.value)}
                      placeholder="Description"
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </td>
                  <td className="px-3 py-2 w-36">
                    <input
                      type="text"
                      value={item.traveller_name ?? ""}
                      onChange={e => updateItem(idx, "traveller_name", e.target.value || null)}
                      placeholder="Name"
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </td>
                  <td className="px-3 py-2 w-32">
                    <input
                      type="date"
                      value={item.travel_date ?? ""}
                      onChange={e => updateItem(idx, "travel_date", e.target.value || null)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </td>
                  <td className="px-3 py-2 w-16">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => updateItem(idx, "quantity", Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </td>
                  <td className="px-3 py-2 w-28">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price ?? 0}
                      onChange={e => updateItem(idx, "unit_price", Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </td>
                  <td className="px-3 py-2 text-right w-24 text-xs font-medium text-gray-900">
                    {((item.quantity ?? 1) * (item.unit_price ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setItems(p => p.filter((_, i) => i !== idx))}
                      className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 px-6 py-4">
          <div className="flex flex-col items-end gap-2 text-sm">
            <div className="flex gap-8 text-gray-600">
              <span>Subtotal</span>
              <span className="w-28 text-right font-medium text-gray-900">
                {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex gap-4 items-center text-gray-600">
              <span>Discount</span>
              <input
                type="number" min="0" step="0.01" value={discount}
                onChange={e => setDiscount(Number(e.target.value))}
                className="w-28 px-2 py-1 text-xs border border-gray-200 rounded-md text-right focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-4 items-center text-gray-600">
              <span>Tax Rate (%)</span>
              <input
                type="number" min="0" max="100" step="0.1" value={taxRate}
                onChange={e => setTaxRate(Number(e.target.value))}
                className="w-28 px-2 py-1 text-xs border border-gray-200 rounded-md text-right focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-4 items-center text-gray-600">
              <span>Tax</span>
              <span className="w-28 text-right text-xs text-gray-500">
                {tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex gap-8 items-center border-t border-gray-200 pt-2 mt-1">
              <span className="font-semibold text-gray-900">Total ({currency})</span>
              <span className="w-28 text-right font-bold text-gray-900 text-base">
                {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              rows={3} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Internal notes..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Terms & Conditions</label>
            <textarea
              rows={3} value={terms} onChange={e => setTerms(e.target.value)}
              placeholder="Payment terms..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="secondary" onClick={() => router.push("/quotations")}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : initialData ? "Update Quotation" : "Create Quotation"}</Button>
      </div>
    </form>
  );
}
