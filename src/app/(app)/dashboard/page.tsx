import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { fmtCurrency } from "@/lib/utils/currency";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ count: travellers }, { count: invoices }, { data: revenue }] = await Promise.all([
    supabase.from("travellers").select("*", { count: "exact", head: true }),
    supabase.from("invoices").select("*", { count: "exact", head: true }).eq("status", "paid"),
    supabase.from("invoices").select("total, currency").eq("status", "paid"),
  ]);

  const totalUSD = revenue?.filter(r => r.currency === "USD").reduce((s, r) => s + r.total, 0) ?? 0;

  const stats = [
    { label: "Total Travellers", value: travellers ?? 0,          icon: "👥", sub: "All time" },
    { label: "Paid Invoices",    value: invoices ?? 0,            icon: "✅", sub: "All time" },
    { label: "Revenue (USD)",    value: fmtCurrency(totalUSD, "USD"), icon: "💰", sub: "Paid invoices" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="À Bientôt Tour & Travels Ltd" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{s.label}</span>
              <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center text-base">
                {s.icon}
              </div>
            </div>
            <p className="font-display text-2xl font-semibold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-display font-semibold text-gray-900 mb-4">Getting Started</h2>
        <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
          <li>Add your first traveller in the Travellers module</li>
          <li>Create a Quotation or Proforma Invoice for their trip</li>
          <li>Convert it to an Invoice once confirmed</li>
          <li>Record payment with a Receipt</li>
          <li>Send the PDF documents directly from each record</li>
        </ol>
      </div>
    </div>
  );
}
