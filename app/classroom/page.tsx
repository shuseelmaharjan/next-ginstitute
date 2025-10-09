"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ClassroomStatsPage() {
  const router = useRouter();
  // Dummy data
  const totalStudents = 1200;
  const totalClassrooms = 24;
  const totalSections = 72;

  return (
      <div className="space-y-4">
          <div>
              <h2 className="text-2xl font-bold tracking-tight">Classroom Statistics</h2>
              <p>
                    Overview of classroom statistics and quick actions.
              </p>
          </div>
          <div className="w-full p-4 border-1 shadow rounded-md mx-auto py-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white shadow rounded-lg p-6 text-center">
                      <div className="text-4xl font-bold text-blue-600">{totalStudents}</div>
                      <div className="mt-2 text-lg">Total Students</div>
                  </div>
                  <div className="bg-white shadow rounded-lg p-6 text-center">
                      <div className="text-4xl font-bold text-green-600">{totalClassrooms}</div>
                      <div className="mt-2 text-lg">Total Classrooms</div>
                  </div>
                  <div className="bg-white shadow rounded-lg p-6 text-center">
                      <div className="text-4xl font-bold text-purple-600">{totalSections}</div>
                      <div className="mt-2 text-lg">Total Sections</div>
                  </div>
              </div>
              <div className="flex gap-4 justify-center">
                  <Button className="cursor-pointer" onClick={() => router.push("/classroom/all-classrooms")}>View Classrooms</Button>
                  <Button className="cursor-pointer" onClick={() => router.push("/classroom/add-classroom")}>Add Classroom</Button>
              </div>
          </div>

      </div>
  );
}
