import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { fmtCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import Link from "next/link";
import type { Role } from "@/types/app";
import { PAYMENT_LABELS } from "@/types/app";

type ReceiptRow = Database["public"]["Tables"]["receipts"]["Row"] & {
  travellers: { first_name: string; last_name: string } | null;
  invoices: { invoice_number: string } | null;
};

export default async function ReceiptsPage() {
  const supabase  = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role    = (user?.user_metadata?.role ?? "viewer") as Role;
  const canEdit = role === "admin" || role === "agent";

  const { data, error } = await supabase
    .from("receipts")
    .select("*, travellers(first_name, last_name), invoices(invoice_number)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const receipts = (data ?? []) as ReceiptRow[];

  return (
    <div>
      <PageHeader
        title="Receipts"
        subtitle={`${receipts.length} receipt${receipts.length !== 1 ? "s" : ""}`}
        actions={canEdit ? (
          <Link href="/receipts/new"><Button>+ New Receipt</Button></Link>
        ) : undefined}
      />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">#</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Traveller</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Invoice</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Method</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Amount</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {receipts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  No receipts yet — create your first one.
                </td>
              </tr>
            ) : receipts.map((r) => {
              const tName = r.travellers
                ? `${r.travellers.first_name} ${r.travellers.last_name}`
                : null;
              return (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.receipt_number}</td>
                  <td className="px-4 py-3">
                    {tName ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={tName} size={28} />
                        <span className="text-gray-900">{tName}</span>
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {r.invoices?.invoice_number ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(r.payment_date)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.payment_method
                      ? (PAYMENT_LABELS[r.payment_method as keyof typeof PAYMENT_LABELS] ?? r.payment_method)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {fmtCurrency(r.amount_paid, r.currency)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/receipts/${r.id}`}>
                      <Button variant="ghost" className="p-1.5 text-xs">
                        {canEdit ? "Edit" : "View"}
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
