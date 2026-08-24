import { cn } from "@/lib/utils";
import type { OnboardingStatus, RequestStatus } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

const onboardingVariants: Record<OnboardingStatus, string> = {
  draft: "border-slate-200 bg-slate-50 text-slate-700",
  pending_review: "border-amber-200 bg-amber-50 text-amber-900",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-900",
  rejected: "border-red-200 bg-red-50 text-red-900",
};

const requestVariants: Record<RequestStatus, string> = {
  in_progress: "border-sky-200 bg-sky-50 text-sky-900",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-900",
  rejected: "border-red-200 bg-red-50 text-red-900",
  on_hold: "border-amber-200 bg-amber-50 text-amber-900",
};

interface StatusBadgeProps {
  status: OnboardingStatus | RequestStatus;
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const variant =
    status in onboardingVariants
      ? onboardingVariants[status as OnboardingStatus]
      : requestVariants[status as RequestStatus];

  return (
    <Badge
      variant="outline"
      className={cn("rounded-md px-2 py-0.5 font-medium shadow-none", variant, className)}
    >
      {label}
    </Badge>
  );
}
