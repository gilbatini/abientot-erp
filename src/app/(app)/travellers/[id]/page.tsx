export default function DetailPage({ params }: { params: { id: string } }) {
  return <div className="p-6 text-gray-400 text-sm">Detail view for {params.id} — coming soon.</div>;
}
