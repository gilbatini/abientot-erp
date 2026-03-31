import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { TravellerForm } from "@/components/travellers/TravellerForm";
import { getById } from "@/actions/travellers";
import type { Role } from "@/types/app";

export default async function EditTravellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.user_metadata?.role ?? "viewer") as Role;

  if (role === "viewer") redirect("/travellers");

  let traveller;
  try {
    traveller = await getById(id);
  } catch {
    notFound();
  }

  const fullName = `${traveller.first_name} ${traveller.last_name}`;

  return (
    <div>
      <PageHeader
        title={fullName}
        subtitle="Edit traveller details"
        actions={
          <Link href="/travellers">
            <Button variant="secondary">← Back</Button>
          </Link>
        }
      />
      <TravellerForm initialData={traveller} />
    </div>
  );
}
