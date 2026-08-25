"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/features/auth/hooks/useSession";
import { PermissionGuard } from "@/components/layout/RBACGuard";
import { Sidebar, Topbar } from "@/components/layout/Sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasHydrated } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <PermissionGuard redirectTo="/login">
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-auto p-4 md:p-7 lg:p-8">{children}</main>
        </div>
      </div>
    </PermissionGuard>
  );
}
