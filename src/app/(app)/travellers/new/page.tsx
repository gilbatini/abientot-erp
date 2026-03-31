import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { TravellerForm } from "@/components/travellers/TravellerForm";
import type { Role } from "@/types/app";

export default async function NewTravellerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.user_metadata?.role ?? "viewer") as Role;

  if (role === "viewer") redirect("/travellers");

  return (
    <div>
      <PageHeader
        title="New Traveller"
        subtitle="Add a new traveller to the system"
        actions={
          <Link href="/travellers">
            <Button variant="secondary">← Back</Button>
          </Link>
        }
      />
      <TravellerForm />
    </div>
  );
}
