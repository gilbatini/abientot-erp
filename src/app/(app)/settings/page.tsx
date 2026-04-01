import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { UserManagement } from "@/components/settings/UserManagement";
import { listUsers } from "@/actions/users";
import type { Role } from "@/types/app";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.user_metadata?.role ?? "viewer") as Role;
  if (role !== "admin") redirect("/dashboard");

  const users = await listUsers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage users and application configuration"
      />
      <UserManagement users={users} currentUserId={user!.id} />
    </div>
  );
}
