import { getWaitlistBySlug } from "../../../services/api";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicWaitlistPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const waitlist = await getWaitlistBySlug(slug);

  if (!waitlist) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto mt-20 p-6 text-center">
      <h1 className="text-4xl font-bold mb-4">{waitlist.name}</h1>
      <p className="text-xl text-gray-600 mb-10">We are currently accepting early access requests.</p>
      
      <div className="bg-gray-100 p-8 rounded-lg inline-block w-full max-w-md border border-dashed border-gray-300">
        <h2 className="text-lg font-semibold mb-2">Join form coming soon</h2>
        <p className="text-gray-500 text-sm">
          Phase 3 MVP: Waitlist public page created successfully.
        </p>
      </div>
    </div>
  );
}
