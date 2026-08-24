import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  title = "No records found",
  description = "There are no items to display for the current filters.",
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card px-6 py-14 text-center shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
        <Inbox className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
