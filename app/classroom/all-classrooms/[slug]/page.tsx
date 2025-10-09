"use client";

import { useParams } from "next/navigation";

export default function ClassroomSlugPage() {
  const params = useParams();
  const slug = params?.slug;

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">Classroom Details</h1>
      <p className="mb-2">Slug: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{slug}</span></p>
      {/* You can fetch and display classroom details here using the slug */}
      <div className="mt-6 text-gray-500">Classroom details will appear here.</div>
    </div>
  );
}

