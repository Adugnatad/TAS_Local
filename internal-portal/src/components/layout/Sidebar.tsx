"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, ROLE_LABELS } from "@/lib/constants";
import { useSession } from "@/features/auth/hooks/useSession";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const iconMap = {
  "/onboarding": Building2,
  "/signatory-matrix": ClipboardList,
  "/status": LayoutDashboard,
};

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useSession();

  return (
    <nav className="flex flex-col gap-1" aria-label="Main navigation">
      {NAV_ITEMS.filter((item) => user && item.roles.includes(user.role)).map((item) => {
        const Icon = iconMap[item.href as keyof typeof iconMap];
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
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
    <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/status" className="font-semibold">
          TAS Portal
        </Link>
      </div>
      <div className="flex flex-1 flex-col justify-between p-4">
        <NavLinks />
        <div className="space-y-3">
          <Separator />
          {user && (
            <div className="px-3 text-sm">
              <p className="font-medium">{user.name}</p>
              <p className="text-muted-foreground">{ROLE_LABELS[user.role]}</p>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
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
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-16 items-center border-b px-6 font-semibold">TAS Portal</div>
        <div className="p-4">
          <NavLinks />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function Topbar() {
  const { user } = useSession();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <span className="font-medium md:hidden">TAS Portal</span>
      </div>
      {user && (
        <div className="text-right text-sm">
          <p className="font-medium">{user.name}</p>
          <p className="text-muted-foreground">{ROLE_LABELS[user.role]}</p>
        </div>
      )}
    </header>
  );
}
