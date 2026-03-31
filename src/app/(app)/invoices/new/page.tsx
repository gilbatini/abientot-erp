import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import type { Role } from "@/types/app";
import type { Database } from "@/types/database";

type TravellerRow = Database["public"]["Tables"]["travellers"]["Row"];

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.user_metadata?.role ?? "viewer") as Role;
  if (role === "viewer") redirect("/invoices");

  const { data } = await supabase
    .from("travellers")
    .select("id, first_name, last_name")
    .order("first_name");
  const travellers = (data ?? []) as Pick<TravellerRow, "id" | "first_name" | "last_name">[];

  return (
    <div>
      <PageHeader title="New Invoice" subtitle="Create a new invoice" />
      <InvoiceForm travellers={travellers} />
    </div>
  );
}
