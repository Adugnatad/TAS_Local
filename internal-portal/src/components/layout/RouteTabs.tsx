"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface RouteTab {
  href: string;
  label: string;
}

export function RouteTabs({ items }: { items: RouteTab[] }) {
  const pathname = usePathname();

  return (
    <nav
      className="flex w-full gap-1 border-b border-border/80"
      aria-label="Section tabs"
    >
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "-mb-px inline-flex items-center border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
