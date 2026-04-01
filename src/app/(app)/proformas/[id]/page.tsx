export default async function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="p-6 text-gray-400 text-sm">Detail view for {id} — coming soon.</div>;
}
