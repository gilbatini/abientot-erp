"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const BUCKET = "traveller-passports";
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export async function uploadPassport(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const file = formData.get("file") as File | null;
  const travellerId = (formData.get("travellerId") as string | null)?.trim();

  if (!file || file.size === 0) throw new Error("No file provided");
  if (!travellerId) throw new Error("Missing traveller ID");
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error("Only JPEG, PNG, or PDF files are allowed");
  if (file.size > MAX_SIZE) throw new Error("File must be under 5 MB");

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${travellerId}/passport.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);

  const { error: updateError } = await supabase
    .from("travellers")
    .update({
      passport_file_path: path,
      passport_uploaded_at: new Date().toISOString(),
      passport_uploaded_by: user.id,
    } as never)
    .eq("id", travellerId);
  if (updateError) throw new Error(updateError.message);

  revalidatePath(`/travellers/${travellerId}`);
  revalidatePath("/travellers");
}

export async function getPassportSignedUrl(filePath: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 300);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function deletePassport(travellerId: string, filePath: string): Promise<void> {
  const supabase = await createClient();

  const { error: removeError } = await supabase.storage
    .from(BUCKET)
    .remove([filePath]);
  if (removeError) throw new Error(removeError.message);

  const { error: updateError } = await supabase
    .from("travellers")
    .update({
      passport_file_path: null,
      passport_uploaded_at: null,
      passport_uploaded_by: null,
    } as never)
    .eq("id", travellerId);
  if (updateError) throw new Error(updateError.message);

  revalidatePath(`/travellers/${travellerId}`);
  revalidatePath("/travellers");
}
