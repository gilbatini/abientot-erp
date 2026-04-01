import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { PageHeader } from "@/components/layout/PageHeader";

type QuotationRow = Database["public"]["Tables"]["quotations"]["Row"] & {
  travellers: { first_name: string; last_name: string } | null;
};
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { fmtCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import Link from "next/link";
import type { Role } from "@/types/app";

export default async function QuotationsPage() {
  const supabase   = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role    = (user?.user_metadata?.role ?? "viewer") as Role;
  const canEdit = role === "admin" || role === "agent";

  const { data, error } = await supabase
    .from("quotations")
    .select("*, travellers(first_name, last_name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const quotations = (data ?? []) as QuotationRow[];

  return (
    <div>
      <PageHeader
        title="Quotations"
        subtitle={`${quotations.length} quotation${quotations.length !== 1 ? "s" : ""}`}
        actions={canEdit ? (
          <Link href="/quotations/new"><Button>+ New Quotation</Button></Link>
        ) : undefined}
      />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">#</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Traveller</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Issue Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Expiry</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Total</th>
              {canEdit && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {quotations.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 7 : 6} className="px-4 py-12 text-center text-gray-400">
                  No quotations yet — create your first one.
                </td>
              </tr>
            ) : quotations.map((q) => {
              const tName = q.travellers
                ? `${q.travellers.first_name} ${q.travellers.last_name}`
                : null;
              return (
                <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{q.number}</td>
                  <td className="px-4 py-3">
                    {tName ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={tName} size={28} />
                        <span className="text-gray-900">{tName}</span>
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(q.issue_date)}</td>
                  <td className="px-4 py-3 text-gray-600">{q.expiry_date ? formatDate(q.expiry_date) : "—"}</td>
                  <td className="px-4 py-3"><Badge status={q.status} /></td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {fmtCurrency(q.total, q.currency)}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      <Link href={`/quotations/${q.id}`}>
                        <Button variant="ghost" className="p-1.5 text-xs">Edit</Button>
                      </Link>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
