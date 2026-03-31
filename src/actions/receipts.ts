"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getNextDocNumber } from "@/lib/utils/numbering";
import type { Database } from "@/types/database";

type ReceiptRow    = Database["public"]["Tables"]["receipts"]["Row"];
type ReceiptInsert = Database["public"]["Tables"]["receipts"]["Insert"];
type ReceiptUpdate = Database["public"]["Tables"]["receipts"]["Update"];
type TravellerRow  = Database["public"]["Tables"]["travellers"]["Row"];
type InvoiceRow    = Database["public"]["Tables"]["invoices"]["Row"];

export type ReceiptWithRefs = ReceiptRow & {
  travellers: Pick<TravellerRow, "first_name" | "last_name" | "email" | "country"> | null;
  invoices:   Pick<InvoiceRow, "invoice_number"> | null;
};

export async function list(): Promise<ReceiptWithRefs[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("receipts")
    .select("*, travellers(first_name, last_name, email, country), invoices(invoice_number)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ReceiptWithRefs[];
}

export async function getById(id: string): Promise<ReceiptWithRefs> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("receipts")
    .select("*, travellers(first_name, last_name, email, country), invoices(invoice_number)")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as ReceiptWithRefs;
}

export async function createReceipt(
  payload: Omit<ReceiptInsert, "receipt_number">,
): Promise<ReceiptRow> {
  const supabase       = await createClient();
  const receipt_number = await getNextDocNumber("receipt");

  const { data, error } = await supabase
    .from("receipts")
    .insert({ ...payload, receipt_number } as never)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/receipts");
  return data as ReceiptRow;
}

export async function updateReceipt(
  id:      string,
  payload: ReceiptUpdate,
): Promise<ReceiptRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("receipts")
    .update(payload as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/receipts");
  return data as ReceiptRow;
}

export async function remove(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("receipts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/receipts");
}

