import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { fmtCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import Link from "next/link";
import type { Role } from "@/types/app";
import type { Database } from "@/types/database";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"] & {
  travellers: { first_name: string; last_name: string } | null;
};

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role    = (user?.user_metadata?.role ?? "viewer") as Role;
  const canEdit = role === "admin" || role === "agent";

  const { data, error } = await supabase
    .from("invoices")
    .select("*, travellers(first_name, last_name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const invoices = (data ?? []) as InvoiceRow[];

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle={`${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}`}
        actions={canEdit ? (
          <Link href="/invoices/new"><Button>+ New Invoice</Button></Link>
        ) : undefined}
      />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">#</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Traveller</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Issue Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Due Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Total</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  No invoices yet — create your first one.
                </td>
              </tr>
            ) : invoices.map((inv) => {
              const tName = inv.travellers
                ? `${inv.travellers.first_name} ${inv.travellers.last_name}`
                : null;
              return (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{inv.invoice_number}</td>
                  <td className="px-4 py-3">
                    {tName ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={tName} size={28} />
                        <span className="text-gray-900">{tName}</span>
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(inv.issue_date)}</td>
                  <td className="px-4 py-3 text-gray-600">{inv.due_date ? formatDate(inv.due_date) : "—"}</td>
                  <td className="px-4 py-3"><Badge status={inv.status} /></td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {fmtCurrency(inv.total, inv.currency)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/invoices/${inv.id}`}>
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
