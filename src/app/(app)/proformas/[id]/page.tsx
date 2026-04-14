import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { DocActions } from "@/components/layout/DocActions";
import { ProformaForm } from "@/components/proformas/ProformaForm";
import { ConvertToInvoiceButton } from "@/components/proformas/ConvertToInvoiceButton";
import { getById, convertProformaToInvoice } from "@/actions/proformas";
import type { Role } from "@/types/app";
import type { Database } from "@/types/database";

type TravellerRow = Database["public"]["Tables"]["travellers"]["Row"];

export default async function EditProformaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role    = (user?.user_metadata?.role ?? "viewer") as Role;
  const canEdit = role === "admin" || role === "agent";

  const [proforma, { data: tData }] = await Promise.all([
    getById(id).catch(() => null),
    supabase.from("travellers").select("id, first_name, last_name").order("first_name"),
  ]);
  if (!proforma) notFound();

  const travellers = (tData ?? []) as Pick<TravellerRow, "id" | "first_name" | "last_name">[];
  const alreadyConverted = !!proforma.converted_to;

  return (
    <div>
      <PageHeader
        title={`Proforma ${proforma.number}`}
        subtitle={canEdit
          ? (alreadyConverted ? "Already converted to invoice" : "Edit proforma details")
          : "View proforma details"}
        actions={
          <div className="flex items-center gap-2">
            <DocActions
              docId={id}
              docNumber={proforma.number}
              docType="proforma"
              travellerEmail={proforma.travellers?.email ?? null}
            />
            {canEdit && !alreadyConverted && (
              <ConvertToInvoiceButton
                onConvert={convertProformaToInvoice.bind(null, id)}
              />
            )}
          </div>
        }
      />
      <ProformaForm travellers={travellers} initialData={proforma} />
    </div>
  );
}
