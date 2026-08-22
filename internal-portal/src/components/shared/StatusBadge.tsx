import { cn } from "@/lib/utils";
import type { OnboardingStatus, RequestStatus } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

const onboardingVariants: Record<OnboardingStatus, string> = {
  draft: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  pending_review: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  approved: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  rejected: "bg-red-100 text-red-800 hover:bg-red-100",
};

const requestVariants: Record<RequestStatus, string> = {
  in_progress: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  completed: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  rejected: "bg-red-100 text-red-800 hover:bg-red-100",
  on_hold: "bg-amber-100 text-amber-800 hover:bg-amber-100",
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
    <Badge variant="outline" className={cn("border-0 font-medium", variant, className)}>
      {label}
    </Badge>
  );
}
