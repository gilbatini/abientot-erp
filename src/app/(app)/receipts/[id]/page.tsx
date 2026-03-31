import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { DocActions } from "@/components/layout/DocActions";
import { ReceiptForm } from "@/components/receipts/ReceiptForm";
import { getById } from "@/actions/receipts";
import type { Role } from "@/types/app";
import type { Database } from "@/types/database";

type TravellerRow = Database["public"]["Tables"]["travellers"]["Row"];
type InvoiceRow   = Database["public"]["Tables"]["invoices"]["Row"];

export default async function EditReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.user_metadata?.role ?? "viewer") as Role;
  if (role === "viewer") redirect("/receipts");

  const [receipt, { data: tData }, { data: iData }] = await Promise.all([
    getById(id).catch(() => null),
    supabase.from("travellers").select("id, first_name, last_name").order("first_name"),
    supabase.from("invoices").select("id, invoice_number").order("invoice_number"),
  ]);
  if (!receipt) notFound();

  const travellers = (tData ?? []) as Pick<TravellerRow, "id" | "first_name" | "last_name">[];
  const invoices   = (iData ?? []) as Pick<InvoiceRow, "id" | "invoice_number">[];

  return (
    <div>
      <PageHeader
        title={`Receipt ${receipt.receipt_number}`}
        subtitle="Edit receipt details"
        actions={
          <DocActions
            docId={id}
            docNumber={receipt.receipt_number}
            docType="receipt"
            travellerEmail={receipt.travellers?.email ?? null}
          />
        }
      />
      <ReceiptForm travellers={travellers} invoices={invoices} initialData={receipt} />
    </div>
  );
}
