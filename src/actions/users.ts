"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Role } from "@/types/app";

export interface AppUser {
  id:         string;
  email:      string;
  role:       Role;
  created_at: string;
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.user_metadata?.role ?? "viewer") as Role;
  if (role !== "admin") throw new Error("Unauthorized");
  return user;
}

export async function listUsers(): Promise<AppUser[]> {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) throw new Error(error.message);
  return data.users.map(u => ({
    id:         u.id,
    email:      u.email ?? "",
    role:       (u.user_metadata?.role ?? "viewer") as Role,
    created_at: u.created_at,
  }));
}

export async function createUser(email: string, password: string, role: Role): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    user_metadata: { role },
    email_confirm: true,
  });
  if (error) throw new Error(error.message);
}

export async function updateUserRole(userId: string, role: Role): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: { role },
  });
  if (error) throw new Error(error.message);
}

export async function deleteUser(userId: string): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
}
