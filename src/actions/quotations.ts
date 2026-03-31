"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function list() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function create(payload: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotations")
    .insert(payload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/quotations");
  return data;
}

export async function update(id: string, payload: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotations")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/quotations");
  return data;
}

export async function remove(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("quotations")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/quotations");
}
