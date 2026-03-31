const STATUS_STYLES: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600",
  sent:      "bg-teal-50 text-teal-700",
  paid:      "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-600",
  approved:  "bg-green-50 text-green-700",
  rejected:  "bg-red-50 text-red-600",
  expired:   "bg-amber-50 text-amber-700",
};

export function Badge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
