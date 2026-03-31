"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database";

type ProformaRow    = Database["public"]["Tables"]["proformas"]["Row"];
type ProformaInsert = Database["public"]["Tables"]["proformas"]["Insert"];
type ProformaUpdate = Database["public"]["Tables"]["proformas"]["Update"];

export async function list(): Promise<ProformaRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proformas")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProformaRow[];
}

export async function getById(id: string): Promise<ProformaRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proformas")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as ProformaRow;
}

export async function create(payload: ProformaInsert): Promise<ProformaRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proformas")
    .insert(payload as never)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/proformas");
  return data as ProformaRow;
}

export async function update(id: string, payload: ProformaUpdate): Promise<ProformaRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proformas")
    .update(payload as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/proformas");
  return data as ProformaRow;
}

export async function remove(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("proformas").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/proformas");
}
