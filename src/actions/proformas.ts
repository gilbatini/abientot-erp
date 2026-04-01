"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getNextDocNumber } from "@/lib/utils/numbering";
import { createInvoice } from "@/actions/invoices";
import type { Database } from "@/types/database";

type ProformaRow    = Database["public"]["Tables"]["proformas"]["Row"];
type ProformaInsert = Database["public"]["Tables"]["proformas"]["Insert"];
type ProformaUpdate = Database["public"]["Tables"]["proformas"]["Update"];
type ItemInsert     = Database["public"]["Tables"]["proforma_items"]["Insert"];
type TravellerRow   = Database["public"]["Tables"]["travellers"]["Row"];

export type ProformaWithTraveller = ProformaRow & {
  travellers: Pick<TravellerRow, "first_name" | "last_name"> | null;
};

export type ProformaItemDraft = Omit<ItemInsert, "proforma_id" | "sort_order" | "id">;

export type ProformaWithItems = ProformaRow & {
  travellers:     Pick<TravellerRow, "first_name" | "last_name" | "email" | "country" | "phone_number" | "phone_code"> | null;
  proforma_items: Database["public"]["Tables"]["proforma_items"]["Row"][];
};

export async function list(): Promise<ProformaWithTraveller[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proformas")
    .select("*, travellers(first_name, last_name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProformaWithTraveller[];
}

export async function getById(id: string): Promise<ProformaWithItems> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proformas")
    .select("*, travellers(first_name, last_name, email, country, phone_number, phone_code), proforma_items(*)")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as ProformaWithItems;
}

export async function createProforma(
  proforma: Omit<ProformaInsert, "number">,
  items:    ProformaItemDraft[],
): Promise<ProformaRow> {
  const supabase = await createClient();
  const number   = await getNextDocNumber("proforma");

  const { data: pf, error: pfErr } = await supabase
    .from("proformas")
    .insert({ ...proforma, number } as never)
    .select()
    .single();
  if (pfErr) throw new Error(pfErr.message);
  const row = pf as ProformaRow;

  if (items.length > 0) {
    const { error: itemErr } = await supabase
      .from("proforma_items")
      .insert(items.map((item, i) => ({ ...item, proforma_id: row.id, sort_order: i })) as never);
    if (itemErr) throw new Error(itemErr.message);
  }

  revalidatePath("/proformas");
  return row;
}

export async function updateProforma(
  id:       string,
  proforma: ProformaUpdate,
  items:    ProformaItemDraft[],
): Promise<ProformaRow> {
  const supabase = await createClient();

  const { data: pf, error: pfErr } = await supabase
    .from("proformas")
    .update(proforma as never)
    .eq("id", id)
    .select()
    .single();
  if (pfErr) throw new Error(pfErr.message);

  await supabase.from("proforma_items").delete().eq("proforma_id" as never, id);

  if (items.length > 0) {
    const { error: itemErr } = await supabase
      .from("proforma_items")
      .insert(items.map((item, i) => ({ ...item, proforma_id: id, sort_order: i })) as never);
    if (itemErr) throw new Error(itemErr.message);
  }

  revalidatePath("/proformas");
  return pf as ProformaRow;
}

export async function remove(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("proforma_items").delete().eq("proforma_id" as never, id);
  const { error } = await supabase.from("proformas").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/proformas");
}

export async function convertProformaToInvoice(proformaId: string): Promise<string> {
  const proforma = await getById(proformaId);

  const items = proforma.proforma_items.map(item => ({
    description:    item.description,
    quantity:       item.quantity,
    unit_price:     item.unit_price,
    currency:       item.currency,
    type:           item.type,
    traveller_name: item.traveller_name,
    travel_date:    item.travel_date,
  }));

  const invoice = await createInvoice({
    traveller_id: proforma.traveller_id,
    issue_date:   new Date().toISOString().slice(0, 10),
    due_date:     null,
    currency:     proforma.currency,
    status:       "draft",
    discount:     proforma.discount,
    tax_rate:     proforma.tax_rate,
    subtotal:     proforma.subtotal,
    total:        proforma.total,
    notes:        proforma.notes,
    terms:        proforma.terms,
  }, items);

  const supabase = await createClient();
  await supabase
    .from("proformas")
    .update({ converted_to: invoice.id } as never)
    .eq("id", proformaId);

  revalidatePath("/proformas");
  revalidatePath("/invoices");
  return invoice.id;
}
