import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { DocActions } from "@/components/layout/DocActions";
import { QuotationForm } from "@/components/quotations/QuotationForm";
import { ConvertToInvoiceButton } from "@/components/proformas/ConvertToInvoiceButton";
import { getById, convertQuotationToInvoice } from "@/actions/quotations";
import type { Role } from "@/types/app";
import type { Database } from "@/types/database";

type TravellerRow = Database["public"]["Tables"]["travellers"]["Row"];

export default async function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role    = (user?.user_metadata?.role ?? "viewer") as Role;
  const canEdit = role === "admin" || role === "agent";

  const [quotation, { data: tData }] = await Promise.all([
    getById(id).catch(() => null),
    supabase.from("travellers").select("id, first_name, last_name").order("first_name"),
  ]);
  if (!quotation) notFound();

  const travellers    = (tData ?? []) as Pick<TravellerRow, "id" | "first_name" | "last_name">[];
  const alreadyConverted = !!quotation.converted_to;

  return (
    <div>
      <PageHeader
        title={`Quotation ${quotation.number}`}
        subtitle={canEdit
          ? (alreadyConverted ? "Already converted to invoice" : "Edit quotation details")
          : "View quotation details"}
        actions={
          <div className="flex items-center gap-2">
            <DocActions
              docId={id}
              docNumber={quotation.number}
              docType="quotation"
              travellerEmail={quotation.travellers?.email ?? null}
            />
            {canEdit && !alreadyConverted && (
              <ConvertToInvoiceButton
                onConvert={convertQuotationToInvoice.bind(null, id)}
              />
            )}
          </div>
        }
      />
      <QuotationForm travellers={travellers} initialData={quotation} />
    </div>
  );
}
