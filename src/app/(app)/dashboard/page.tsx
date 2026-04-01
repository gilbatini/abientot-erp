import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { fmtCurrency } from "@/lib/utils/currency";
import Link from "next/link";
import type { Database } from "@/types/database";

type InvoiceRow   = Database["public"]["Tables"]["invoices"]["Row"] & { travellers: { first_name: string; last_name: string } | null };
type QuotationRow = Database["public"]["Tables"]["quotations"]["Row"] & { travellers: { first_name: string; last_name: string } | null };

function fmtShortDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: travellerCount },
    { count: quotationCount },
    { count: proformaCount },
    { data: allInvoicesData },
    { data: recentInvoicesData },
    { data: recentQuotationsData },
  ] = await Promise.all([
    supabase.from("travellers").select("*", { count: "exact", head: true }),
    supabase.from("quotations").select("*", { count: "exact", head: true }),
    supabase.from("proformas").select("*", { count: "exact", head: true }),
    supabase.from("invoices").select("status, total, currency"),
    supabase
      .from("invoices")
      .select("id, invoice_number, status, total, currency, due_date, travellers(first_name, last_name)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("quotations")
      .select("id, number, status, total, currency, expiry_date, travellers(first_name, last_name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const allInvoices = (allInvoicesData ?? []) as { status: string; total: number; currency: string }[];
  const recentInvoices  = (recentInvoicesData  ?? []) as InvoiceRow[];
  const recentQuotations = (recentQuotationsData ?? []) as QuotationRow[];

  const invoiceCounts = {
    draft:     allInvoices.filter(i => i.status === "draft").length,
    sent:      allInvoices.filter(i => i.status === "sent").length,
    paid:      allInvoices.filter(i => i.status === "paid").length,
    cancelled: allInvoices.filter(i => i.status === "cancelled").length,
  };
  const totalInvoices = allInvoices.length;

  const revenueUSD = allInvoices
    .filter(i => i.status === "paid" && i.currency === "USD")
    .reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="À Bientôt Tour & Travels Ltd" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Travellers"    value={travellerCount ?? 0} icon="👥" sub="registered" />
        <StatCard label="Quotations"    value={quotationCount ?? 0} icon="📋" sub="all time" />
        <StatCard label="Proformas"     value={proformaCount ?? 0}  icon="📄" sub="all time" />
        <StatCard label="Invoices"      value={totalInvoices}       icon="🧾" sub="all time" />
        <StatCard label="Revenue (USD)" value={fmtCurrency(revenueUSD, "USD")} icon="💰" sub="paid invoices" />
      </div>

      {/* Invoice status breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-display font-semibold text-gray-900 mb-4 text-sm">Invoice Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(["draft","sent","paid","cancelled"] as const).map(s => (
            <div key={s} className="text-center">
              <p className="font-display text-2xl font-bold text-gray-900">{invoiceCounts[s]}</p>
              <Badge status={s} />
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-gray-900 text-sm">Recent Invoices</h2>
            <Link href="/invoices" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-gray-400">No invoices yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentInvoices.map(inv => {
                const traveller = inv.travellers;
                const name = traveller ? `${traveller.first_name} ${traveller.last_name}` : "—";
                return (
                  <li key={inv.id} className="flex items-center justify-between text-sm">
                    <div>
                      <Link href={`/invoices/${inv.id}`} className="font-medium text-gray-900 hover:text-primary">
                        {inv.invoice_number}
                      </Link>
                      <p className="text-xs text-gray-400">{name} · {fmtShortDate(inv.due_date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">{fmtCurrency(inv.total, inv.currency)}</span>
                      <Badge status={inv.status} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Recent Quotations */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-gray-900 text-sm">Recent Quotations</h2>
            <Link href="/quotations" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {recentQuotations.length === 0 ? (
            <p className="text-sm text-gray-400">No quotations yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentQuotations.map(q => {
                const traveller = q.travellers;
                const name = traveller ? `${traveller.first_name} ${traveller.last_name}` : "—";
                return (
                  <li key={q.id} className="flex items-center justify-between text-sm">
                    <div>
                      <Link href={`/quotations/${q.id}`} className="font-medium text-gray-900 hover:text-primary">
                        {q.number}
                      </Link>
                      <p className="text-xs text-gray-400">{name} · {fmtShortDate(q.expiry_date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">{fmtCurrency(q.total, q.currency)}</span>
                      <Badge status={q.status} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, sub }: { label: string; value: string | number; icon: string; sub: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-base">{icon}</div>
      </div>
      <p className="font-display text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
