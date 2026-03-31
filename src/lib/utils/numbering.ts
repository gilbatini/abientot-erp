import { createClient } from "@/lib/supabase/server";

export type DocKey = "invoice" | "receipt" | "proforma" | "quotation";

export async function getNextDocNumber(key: DocKey): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("next_doc_number", { doc_key: key });
  if (error) throw new Error(`Failed to generate document number: ${error.message}`);
  return data as string;
}
