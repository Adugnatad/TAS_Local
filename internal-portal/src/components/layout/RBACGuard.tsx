"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useSession } from "@/features/auth/hooks/useSession";
import type { OfficerRole } from "@/lib/constants";
import { Button } from "@/components/ui/button";

interface RBACGuardProps {
  allowedRoles: OfficerRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function RBACGuard({
  allowedRoles,
  children,
  fallback,
  redirectTo,
}: RBACGuardProps) {
  const { user, isAuthenticated } = useSession();
  const router = useRouter();

  const isAllowed = isAuthenticated && user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!isAuthenticated && redirectTo) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, redirectTo, router]);

  if (!isAuthenticated) {
    return null;
  }

  if (!isAllowed) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-semibold">Not authorized</h2>
          <p className="mt-2 text-muted-foreground">
            Your role does not have permission to access this section.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/status")}>
          Go to Status Viewer
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

interface RoleGateProps {
  allowedRoles: OfficerRole[];
  children: React.ReactNode;
}

export function RoleGate({ allowedRoles, children }: RoleGateProps) {
  const { user } = useSession();
  if (!user || !allowedRoles.includes(user.role)) return null;
  return <>{children}</>;
}
