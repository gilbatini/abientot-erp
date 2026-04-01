import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { DocActions } from "@/components/layout/DocActions";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { getById } from "@/actions/invoices";
import type { Role } from "@/types/app";
import type { Database } from "@/types/database";

type TravellerRow = Database["public"]["Tables"]["travellers"]["Row"];

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role    = (user?.user_metadata?.role ?? "viewer") as Role;
  const canEdit = role === "admin" || role === "agent";

  const [invoice, { data: tData }] = await Promise.all([
    getById(id).catch(() => null),
    supabase.from("travellers").select("id, first_name, last_name").order("first_name"),
  ]);
  if (!invoice) notFound();

  const travellers = (tData ?? []) as Pick<TravellerRow, "id" | "first_name" | "last_name">[];

  return (
    <div>
      <PageHeader
        title={`Invoice ${invoice.invoice_number}`}
        subtitle={canEdit ? "Edit invoice details" : "View invoice details"}
        actions={
          <DocActions
            docId={id}
            docNumber={invoice.invoice_number}
            docType="invoice"
            travellerEmail={invoice.travellers?.email ?? null}
          />
        }
      />
      <InvoiceForm travellers={travellers} initialData={invoice} />
    </div>
  );
}
