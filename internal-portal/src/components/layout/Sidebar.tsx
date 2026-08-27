"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LogOut,
  Menu,
  Shield,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { useSession } from "@/features/auth/hooks/useSession";
import { displayName } from "@/features/auth/types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";

const iconMap: Record<string, typeof Building2> = {
  "/organizations": Building2,
  "/employees": Users,
  "/roles": Shield,
  "/profile": UserRound,
};

function BrandMark() {
  return (
    <Link href="/organizations" className="flex min-w-0 flex-col gap-1.5">
      <BrandLogo className="p-1.5" imageClassName="h-8 w-auto max-w-[168px]" />
      <span className="text-[11px] font-medium tracking-wide text-sidebar-muted">
        TAS Portal
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { canAny } = useSession();

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Main navigation">
      {NAV_ITEMS.filter(
        (item) => item.permissions.length === 0 || canAny(...item.permissions),
      ).map((item) => {
        const Icon = iconMap[item.href] ?? Building2;
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-white/10 text-sidebar-foreground before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"
                : "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className={cn("h-4 w-4", isActive && "text-primary")} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const { user, clearSession } = useSession();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
      <div className="flex h-[4.25rem] items-center border-b border-sidebar-border px-5">
        <BrandMark />
      </div>
      <div className="flex flex-1 flex-col justify-between p-3">
        <NavLinks />
        <div className="space-y-3">
          <Separator className="bg-sidebar-border" />
          {user && (
            <Link
              href="/profile"
              className="block rounded-md px-3 py-2 transition-colors hover:bg-white/5"
            >
              <p className="text-sm font-medium text-sidebar-foreground">{displayName(user)}</p>
              <p className="text-xs text-sidebar-muted">{user.roles.join(", ") || "Employee"}</p>
            </Link>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground"
            onClick={() => {
              clearSession();
              window.location.href = "/login";
            }}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open navigation menu"
          />
        }
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-60 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
      >
        <div className="flex h-[4.25rem] items-center border-b border-sidebar-border px-5">
          <BrandMark />
        </div>
        <div className="p-3">
          <NavLinks />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function Topbar() {
  const { user } = useSession();

  return (
    <header className="flex h-[4.25rem] items-center justify-between border-b border-border/80 bg-card/90 px-4 backdrop-blur-sm md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <span className="text-sm font-semibold tracking-wide text-primary md:hidden">COOP</span>
      </div>
      {user && (
        <div className="flex items-center gap-3">
          <NotificationBell />
          <span className="rounded-md border border-border/80 bg-muted/60 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {user.roles[0] ?? "Employee"}
          </span>
          <Link
            href="/profile"
            className="hidden text-right text-sm transition-colors hover:text-primary sm:block"
          >
            <p className="font-medium leading-none">{displayName(user)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{user.email ?? user.username}</p>
          </Link>
        </div>
      )}
    </header>
  );
}
