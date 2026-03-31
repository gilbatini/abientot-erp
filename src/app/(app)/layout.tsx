import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import type { Role } from "@/types/app";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role     = (user?.user_metadata?.role ?? "viewer") as Role;
  const name     = user?.user_metadata?.name ?? user?.email ?? "User";

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role={role} userName={name} />
      <main className="ml-60 p-6 min-h-screen">
        {children}
      </main>
    </div>
  );
}
