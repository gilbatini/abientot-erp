import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { QuotationForm } from "@/components/quotations/QuotationForm";
import type { Role } from "@/types/app";
import type { Database } from "@/types/database";

type TravellerRow = Database["public"]["Tables"]["travellers"]["Row"];

export default async function NewQuotationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.user_metadata?.role ?? "viewer") as Role;
  if (role === "viewer") redirect("/quotations");

  const { data } = await supabase
    .from("travellers")
    .select("id, first_name, last_name")
    .order("first_name");
  const travellers = (data ?? []) as Pick<TravellerRow, "id" | "first_name" | "last_name">[];

  return (
    <div>
      <PageHeader title="New Quotation" subtitle="Create a new quotation" />
      <QuotationForm travellers={travellers} />
    </div>
  );
}
