"use client";

import { useEffect, useState, memo } from "react";
import { useRouter } from "next/navigation";
import { useAccessToken } from "./AccessTokenContext";

type Props = {
  children: React.ReactNode;
};

const PrivateRoute = memo(function PrivateRoute({ children }: Props) {
  const { isAuthenticated, loading, user } = useAccessToken();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're not loading and not authenticated
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  // Show loading only if we're still initializing authentication
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-lg">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span>Checking session...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render children (redirect will happen in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
});

export default PrivateRoute;
