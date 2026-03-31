"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function list() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function create(payload: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("receipts")
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/receipts");
  return data;
}

export async function update(id: string, payload: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("receipts")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/receipts");
  return data;
}

export async function remove(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("receipts")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/receipts");
}
