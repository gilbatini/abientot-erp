import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReceiptForm } from "@/components/receipts/ReceiptForm";
import type { Role } from "@/types/app";
import type { Database } from "@/types/database";

type TravellerRow = Database["public"]["Tables"]["travellers"]["Row"];
type InvoiceRow   = Database["public"]["Tables"]["invoices"]["Row"];

export default async function NewReceiptPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.user_metadata?.role ?? "viewer") as Role;
  if (role === "viewer") redirect("/receipts");

  const [{ data: tData }, { data: iData }] = await Promise.all([
    supabase.from("travellers").select("id, first_name, last_name").order("first_name"),
    supabase.from("invoices").select("id, invoice_number").order("invoice_number"),
  ]);
  const travellers = (tData ?? []) as Pick<TravellerRow, "id" | "first_name" | "last_name">[];
  const invoices   = (iData ?? []) as Pick<InvoiceRow, "id" | "invoice_number">[];

  return (
    <div>
      <PageHeader title="New Receipt" subtitle="Record a new payment" />
      <ReceiptForm travellers={travellers} invoices={invoices} />
    </div>
  );
}
