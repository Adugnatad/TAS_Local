"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useSession } from "@/features/auth/hooks/useSession";
import { Button } from "@/components/ui/button";

interface PermissionGuardProps {
  anyOf?: readonly string[];
  allOf?: readonly string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function PermissionGuard({
  anyOf,
  allOf,
  children,
  fallback,
  redirectTo,
}: PermissionGuardProps) {
  const { user, isAuthenticated, canAny } = useSession();
  const router = useRouter();
  const isAllowed =
    (!anyOf || anyOf.length === 0 || canAny(...anyOf)) &&
    (!allOf ||
      allOf.length === 0 ||
      allOf.every((permission) => user?.permissions.includes(permission)));

  useEffect(() => {
    if (!isAuthenticated && redirectTo) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, redirectTo, router]);

  if (!isAuthenticated) {
    return null;
  }

  if (!isAllowed || user?.userType !== "EMPLOYEE") {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
        <div>
          <h2 className="text-xl font-semibold">Not authorized</h2>
          <p className="mt-2 text-muted-foreground">
            You do not have permission to access this section.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/organizations")}>
          Go to Organizations
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

export function PermissionGate({
  anyOf,
  children,
}: {
  anyOf: readonly string[];
  children: React.ReactNode;
}) {
  const { canAny } = useSession();
  if (!canAny(...anyOf)) return null;
  return <>{children}</>;
}

export function RoleGuard({
  roles,
  children,
}: {
  roles: readonly string[];
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useSession();
  const isAllowed = user?.roles?.some((role) => roles.includes(role));

  if (!isAuthenticated || !isAllowed) return null;
  return <>{children}</>;
}
