import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { DocActions } from "@/components/layout/DocActions";
import { QuotationForm } from "@/components/quotations/QuotationForm";
import { getById } from "@/actions/quotations";
import type { Role } from "@/types/app";
import type { Database } from "@/types/database";

type TravellerRow = Database["public"]["Tables"]["travellers"]["Row"];

export default async function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.user_metadata?.role ?? "viewer") as Role;
  if (role === "viewer") redirect("/quotations");

  const [quotation, { data: tData }] = await Promise.all([
    getById(id).catch(() => null),
    supabase.from("travellers").select("id, first_name, last_name").order("first_name"),
  ]);
  if (!quotation) notFound();

  const travellers = (tData ?? []) as Pick<TravellerRow, "id" | "first_name" | "last_name">[];

  return (
    <div>
      <PageHeader
        title={`Quotation ${quotation.number}`}
        subtitle="Edit quotation details"
        actions={
          <DocActions
            docId={id}
            docNumber={quotation.number}
            docType="quotation"
            travellerEmail={quotation.travellers?.email ?? null}
          />
        }
      />
      <QuotationForm travellers={travellers} initialData={quotation} />
    </div>
  );
}
