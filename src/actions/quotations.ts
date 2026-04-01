"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getNextDocNumber } from "@/lib/utils/numbering";
import { createInvoice } from "@/actions/invoices";
import type { Database } from "@/types/database";

type QuotationRow    = Database["public"]["Tables"]["quotations"]["Row"];
type QuotationInsert = Database["public"]["Tables"]["quotations"]["Insert"];
type QuotationUpdate = Database["public"]["Tables"]["quotations"]["Update"];
type ItemInsert      = Database["public"]["Tables"]["quotation_items"]["Insert"];
type TravellerRow    = Database["public"]["Tables"]["travellers"]["Row"];

export type QuotationWithTraveller = QuotationRow & {
  travellers: Pick<TravellerRow, "first_name" | "last_name"> | null;
};

export type QuotationItemDraft = Omit<ItemInsert, "quotation_id" | "sort_order" | "id">;

export type QuotationWithItems = QuotationRow & {
  travellers:      Pick<TravellerRow, "first_name" | "last_name" | "email" | "country" | "phone_number" | "phone_code"> | null;
  quotation_items: Database["public"]["Tables"]["quotation_items"]["Row"][];
};

export async function list(): Promise<QuotationWithTraveller[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotations")
    .select("*, travellers(first_name, last_name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as QuotationWithTraveller[];
}

export async function getById(id: string): Promise<QuotationWithItems> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotations")
    .select("*, travellers(first_name, last_name, email, country, phone_number, phone_code), quotation_items(*)")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as QuotationWithItems;
}

export async function createQuotation(
  quotation: Omit<QuotationInsert, "number">,
  items:     QuotationItemDraft[],
): Promise<QuotationRow> {
  const supabase = await createClient();
  const number   = await getNextDocNumber("quotation");

  const { data: quot, error: quotErr } = await supabase
    .from("quotations")
    .insert({ ...quotation, number } as never)
    .select()
    .single();
  if (quotErr) throw new Error(quotErr.message);
  const row = quot as QuotationRow;

  if (items.length > 0) {
    const { error: itemErr } = await supabase
      .from("quotation_items")
      .insert(items.map((item, i) => ({ ...item, quotation_id: row.id, sort_order: i })) as never);
    if (itemErr) throw new Error(itemErr.message);
  }

  revalidatePath("/quotations");
  return row;
}

export async function updateQuotation(
  id:        string,
  quotation: QuotationUpdate,
  items:     QuotationItemDraft[],
): Promise<QuotationRow> {
  const supabase = await createClient();

  const { data: quot, error: quotErr } = await supabase
    .from("quotations")
    .update(quotation as never)
    .eq("id", id)
    .select()
    .single();
  if (quotErr) throw new Error(quotErr.message);

  await supabase.from("quotation_items").delete().eq("quotation_id" as never, id);

  if (items.length > 0) {
    const { error: itemErr } = await supabase
      .from("quotation_items")
      .insert(items.map((item, i) => ({ ...item, quotation_id: id, sort_order: i })) as never);
    if (itemErr) throw new Error(itemErr.message);
  }

  revalidatePath("/quotations");
  return quot as QuotationRow;
}

export async function remove(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("quotation_items").delete().eq("quotation_id" as never, id);
  const { error } = await supabase.from("quotations").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/quotations");
}

export async function convertQuotationToInvoice(quotationId: string): Promise<string> {
  const quotation = await getById(quotationId);

  const items = quotation.quotation_items.map(item => ({
    description:    item.description,
    quantity:       item.quantity,
    unit_price:     item.unit_price,
    currency:       item.currency,
    type:           item.type,
    traveller_name: item.traveller_name,
    travel_date:    item.travel_date,
  }));

  const invoice = await createInvoice({
    traveller_id: quotation.traveller_id,
    issue_date:   new Date().toISOString().slice(0, 10),
    due_date:     null,
    currency:     quotation.currency,
    status:       "draft",
    discount:     quotation.discount,
    tax_rate:     quotation.tax_rate,
    subtotal:     quotation.subtotal,
    total:        quotation.total,
    notes:        quotation.notes,
    terms:        quotation.terms,
  }, items);

  const supabase = await createClient();
  await supabase
    .from("quotations")
    .update({ converted_to: invoice.id } as never)
    .eq("id", quotationId);

  revalidatePath("/quotations");
  revalidatePath("/invoices");
  return invoice.id;
}
