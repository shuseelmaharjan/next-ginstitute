"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UpdateAboutRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the list page — prefer using the route with id from the list
    router.replace("/site/about");
  }, [router]);

  return (
    <Card className="p-6 text-center">
      <div>Redirecting to About list...</div>
      <div className="mt-4">
        <Button variant="outline" onClick={() => router.push("/site/about")}>Go to About</Button>
      </div>
    </Card>
  );
}
