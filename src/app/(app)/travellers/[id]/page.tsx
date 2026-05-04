import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { TravellerForm } from "@/components/travellers/TravellerForm";
import { PassportUpload } from "@/components/travellers/PassportUpload";
import { getById } from "@/actions/travellers";
import type { Role } from "@/types/app";

export default async function EditTravellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role    = (user?.user_metadata?.role ?? "viewer") as Role;
  const canEdit = role === "admin" || role === "agent";
  const userId  = user?.id ?? "";

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
        subtitle={canEdit ? "Edit traveller details" : "View traveller details"}
        actions={
          <Link href="/travellers">
            <Button variant="secondary">← Back</Button>
          </Link>
        }
      />
      <TravellerForm initialData={traveller} />
      <PassportUpload
        travellerId={traveller.id}
        role={role}
        userId={userId}
        passportFilePath={traveller.passport_file_path ?? null}
        passportUploadedAt={traveller.passport_uploaded_at ?? null}
        passportUploadedBy={traveller.passport_uploaded_by ?? null}
      />
    </div>
  );
}
