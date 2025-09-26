"use client";

import { useEffect, memo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccessToken } from "./AccessTokenContext";

type Props = {
  children: React.ReactNode;
};

const PrivateRoute = memo(function PrivateRoute({ children }: Props) {
  const { isAuthenticated, loading } = useAccessToken();
  const router = useRouter();
  const [hasSessionCookie, setHasSessionCookie] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for 'session' cookie first
    const getCookie = (name: string) => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };
    setHasSessionCookie(getCookie('session') === 'true');
  }, []);

  useEffect(() => {
    // Only redirect if we're not loading and not authenticated and no session cookie
    if (hasSessionCookie === false && !loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hasSessionCookie, loading, isAuthenticated, router]);

  // Show loading only if we're still initializing authentication
  if (loading || hasSessionCookie === null) {
    return (
      <div className="h-screen flex items-center justify-center text-lg">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span>Checking session...</span>
        </div>
      </div>
    );
  }

  // If not authenticated and no session cookie, don't render children (redirect will happen in useEffect)
  if (!isAuthenticated && !hasSessionCookie) {
    return null;
  }

  return <>{children}</>;
});

export default PrivateRoute;
