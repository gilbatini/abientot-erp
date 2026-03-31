"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getNextDocNumber } from "@/lib/utils/numbering";
import type { Database } from "@/types/database";

type InvoiceRow     = Database["public"]["Tables"]["invoices"]["Row"];
type InvoiceInsert  = Database["public"]["Tables"]["invoices"]["Insert"];
type InvoiceUpdate  = Database["public"]["Tables"]["invoices"]["Update"];
type ItemInsert     = Database["public"]["Tables"]["invoice_items"]["Insert"];
type TravellerRow   = Database["public"]["Tables"]["travellers"]["Row"];

export type InvoiceWithTraveller = InvoiceRow & {
  travellers: Pick<TravellerRow, "first_name" | "last_name"> | null;
};

export type ItemDraft = Omit<ItemInsert, "invoice_id" | "sort_order" | "id">;

export type InvoiceWithItems = InvoiceRow & {
  travellers:    Pick<TravellerRow, "first_name" | "last_name" | "email" | "country"> | null;
  invoice_items: Database["public"]["Tables"]["invoice_items"]["Row"][];
};

export async function list(): Promise<InvoiceWithTraveller[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, travellers(first_name, last_name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as InvoiceWithTraveller[];
}

export async function getById(id: string): Promise<InvoiceWithItems> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, travellers(first_name, last_name, email, country), invoice_items(*)")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as InvoiceWithItems;
}

export async function createInvoice(
  invoice: Omit<InvoiceInsert, "invoice_number">,
  items:   ItemDraft[],
): Promise<InvoiceRow> {
  const supabase       = await createClient();
  const invoice_number = await getNextDocNumber("invoice");

  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .insert({ ...invoice, invoice_number } as never)
    .select()
    .single();
  if (invErr) throw new Error(invErr.message);
  const row = inv as InvoiceRow;

  if (items.length > 0) {
    const { error: itemErr } = await supabase
      .from("invoice_items")
      .insert(items.map((item, i) => ({ ...item, invoice_id: row.id, sort_order: i })) as never);
    if (itemErr) throw new Error(itemErr.message);
  }

  revalidatePath("/invoices");
  return row;
}

export async function updateInvoice(
  id:      string,
  invoice: InvoiceUpdate,
  items:   ItemDraft[],
): Promise<InvoiceRow> {
  const supabase = await createClient();

  const { data: inv, error: invErr } = await supabase
    .from("invoices")
    .update(invoice as never)
    .eq("id", id)
    .select()
    .single();
  if (invErr) throw new Error(invErr.message);

  await supabase.from("invoice_items").delete().eq("invoice_id" as never, id);

  if (items.length > 0) {
    const { error: itemErr } = await supabase
      .from("invoice_items")
      .insert(items.map((item, i) => ({ ...item, invoice_id: id, sort_order: i })) as never);
    if (itemErr) throw new Error(itemErr.message);
  }

  revalidatePath("/invoices");
  return inv as InvoiceRow;
}

export async function remove(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("invoice_items").delete().eq("invoice_id" as never, id);
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/invoices");
}

