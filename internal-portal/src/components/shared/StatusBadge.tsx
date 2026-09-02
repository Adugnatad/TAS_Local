import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const variants: Record<string, string> = {
  ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-900",
  SUSPENDED: "border-amber-200 bg-amber-50 text-amber-900",
  TERMINATED: "border-red-200 bg-red-50 text-red-900",
  VALIDATED: "border-emerald-200 bg-emerald-50 text-emerald-900",
  NOT_VALIDATED: "border-amber-200 bg-amber-50 text-amber-900",
  NAME_MISMATCH: "border-red-200 bg-red-50 text-red-900",
  PENDING: "border-amber-200 bg-amber-50 text-amber-900",
  PENDING_REVIEW: "border-amber-200 bg-amber-50 text-amber-900",
  CHANGES_REQUESTED: "border-orange-200 bg-orange-50 text-orange-900",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-900",
  REJECTED: "border-red-200 bg-red-50 text-red-900",
  TRIGGERED: "border-emerald-200 bg-emerald-50 text-emerald-900",
  TRIGGER_FAILED: "border-red-200 bg-red-50 text-red-900",
  AUTHORIZED: "border-emerald-200 bg-emerald-50 text-emerald-900",
  NOT_AUTHORIZED: "border-red-200 bg-red-50 text-red-900",
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const variant = variants[status] ?? "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <Badge
      variant="outline"
      className={cn("rounded-md px-2 py-0.5 font-medium shadow-none", variant, className)}
    >
      {label ?? status.replaceAll("_", " ")}
    </Badge>
  );
}
