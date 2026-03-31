import { PageHeader } from "@/components/layout/PageHeader";

export default function Page() {
  return (
    <div>
      <PageHeader
        title="Quotations"
        subtitle="Build in Phase 2–4 — see CLAUDE.md for architecture rules"
      />
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
        Module scaffolded and ready to build.
      </div>
    </div>
  );
}
