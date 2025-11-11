"use client";

import { useEffect, memo } from "react";
import { useRouter } from "next/navigation";
import { useAuthenticate } from "./AuthenticateContext";

type Props = {
  children: React.ReactNode;
};

const PrivateRoute = memo(function PrivateRoute({ children }: Props) {
  const { isAuthenticated, loading } = useAuthenticate();
  const router = useRouter();

  useEffect(() => {
    // When auth finished loading and user is not authenticated, redirect to login
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Show loading while authenticate context initializes
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

  // If not authenticated after loading, don't render children (redirect happening in useEffect)
  if (!isAuthenticated) return null;

  return <>{children}</>;
});

export default PrivateRoute;
