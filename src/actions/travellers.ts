"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Database } from "@/types/database";

type TravellerRow    = Database["public"]["Tables"]["travellers"]["Row"];
type TravellerInsert = Database["public"]["Tables"]["travellers"]["Insert"];
type TravellerUpdate = Database["public"]["Tables"]["travellers"]["Update"];

export async function list(): Promise<TravellerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("travellers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as TravellerRow[];
}

export async function getById(id: string): Promise<TravellerRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("travellers")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as TravellerRow;
}

export async function create(payload: TravellerInsert): Promise<TravellerRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("travellers")
    .insert(payload as never)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/travellers");
  return data as TravellerRow;
}

export async function update(id: string, payload: TravellerUpdate): Promise<TravellerRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("travellers")
    .update(payload as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/travellers");
  return data as TravellerRow;
}

export async function remove(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("travellers")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/travellers");
}
