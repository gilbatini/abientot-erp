"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { create, update } from "@/actions/travellers";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Database } from "@/types/database";

type TravellerRow = Database["public"]["Tables"]["travellers"]["Row"];

interface TravellerFormProps {
  initialData?: TravellerRow;
}

export function TravellerForm({ initialData }: TravellerFormProps) {
  const router  = useRouter();
  const isEdit  = !!initialData;
  const [error,  setError]  = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const str = (key: string) => (fd.get(key) as string).trim() || null;

    const payload = {
      first_name:      (fd.get("first_name") as string).trim(),
      last_name:       (fd.get("last_name") as string).trim(),
      email:           str("email"),
      phone_code:      str("phone_code"),
      phone_number:    str("phone_number"),
      country:         str("country"),
      dob:             str("dob"),
      passport:        str("passport"),
      notes:           str("notes"),
    };

    try {
      if (isEdit) {
        await update(initialData.id, payload);
      } else {
        await create(payload);
      }
      router.push("/travellers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save traveller");
      setSaving(false);
    }
  }

  return (
    <Card className="p-6 max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Name */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            name="first_name"
            required
            placeholder="Jane"
            defaultValue={initialData?.first_name ?? ""}
          />
          <Input
            label="Last Name"
            name="last_name"
            required
            placeholder="Doe"
            defaultValue={initialData?.last_name ?? ""}
          />
        </div>

        {/* Email + Country */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="jane@example.com"
            defaultValue={initialData?.email ?? ""}
          />
          <Input
            label="Country"
            name="country"
            placeholder="Uganda"
            defaultValue={initialData?.country ?? ""}
          />
        </div>

        {/* Phone */}
        <div className="grid grid-cols-[110px_1fr] gap-4">
          <Input
            label="Code"
            name="phone_code"
            placeholder="+256"
            defaultValue={initialData?.phone_code ?? ""}
          />
          <Input
            label="Phone Number"
            name="phone_number"
            placeholder="788 138 721"
            defaultValue={initialData?.phone_number ?? ""}
          />
        </div>

        {/* DOB + Passport */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Date of Birth"
            name="dob"
            type="date"
            defaultValue={initialData?.dob ?? ""}
          />
          <Input
            label="Passport Number"
            name="passport"
            placeholder="A12345678"
            defaultValue={initialData?.passport ?? ""}
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Any additional notes…"
            defaultValue={initialData?.notes ?? ""}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900
                       placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30
                       focus:border-primary transition-colors resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Traveller"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/travellers")}
          >
            Cancel
          </Button>
        </div>

      </form>
    </Card>
  );
}
