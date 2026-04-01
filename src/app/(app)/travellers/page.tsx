import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils/dates";
import Link from "next/link";
import type { Role } from "@/types/app";
import type { Database } from "@/types/database";

type TravellerRow = Database["public"]["Tables"]["travellers"]["Row"];

export default async function TravellersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role     = (user?.user_metadata?.role ?? "viewer") as Role;
  const canEdit  = role === "admin" || role === "agent";

  const { data, error } = await supabase
    .from("travellers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const travellers = (data ?? []) as TravellerRow[];

  return (
    <div>
      <PageHeader
        title="Travellers"
        subtitle={`${(travellers ?? []).length} traveller${(travellers ?? []).length !== 1 ? "s" : ""}`}
        actions={canEdit ? (
          <Link href="/travellers/new">
            <Button>+ Add Traveller</Button>
          </Link>
        ) : undefined}
      />

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Traveller</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Country</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Passport</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Added</th>
              {canEdit && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(travellers ?? []).length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 6 : 5} className="px-4 py-12 text-center text-gray-400">
                  No travellers yet — add your first one.
                </td>
              </tr>
            ) : (
              (travellers ?? []).map((t) => {
                const fullName = `${t.first_name} ${t.last_name}`;
                return (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={fullName} />
                        <span className="font-medium text-gray-900">{fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.email ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{t.country ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{t.passport ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {t.created_at ? formatDate(t.created_at) : "—"}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <Link href={`/travellers/${t.id}`}>
                          <Button variant="ghost" className="p-1.5 text-xs">Edit</Button>
                        </Link>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
