import * as React from "react";
import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      className={cn(
        "size-4 shrink-0 rounded-[4px] border border-input bg-card text-primary accent-primary shadow-sm outline-none transition-colors hover:border-primary/40 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Checkbox };
