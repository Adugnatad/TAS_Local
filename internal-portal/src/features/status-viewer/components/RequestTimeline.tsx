import { Check, Circle } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { REQUEST_STATUS_LABELS } from "@/lib/constants";
import type { RequestStatusDetail } from "../types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RequestTimelineProps {
  request: RequestStatusDetail;
}

export function RequestTimeline({ request }: RequestTimelineProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>{request.id}</CardTitle>
              <p className="mt-1 text-muted-foreground">{request.customerName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="capitalize">
                {request.type}
              </Badge>
              <StatusBadge
                status={request.status}
                label={REQUEST_STATUS_LABELS[request.status]}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="font-semibold">{formatCurrency(request.amount)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Submitted</p>
            <p className="font-semibold">{formatDate(request.submittedAt)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Updated</p>
            <p className="font-semibold">{formatDate(request.lastUpdatedAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:justify-between">
            {request.stages.map((stage, index) => {
              const isCompleted =
                request.status === "completed" ||
                request.stages.findIndex((s) => s.isCurrent) > index;
              const isCurrent = stage.isCurrent;
              return (
                <li
                  key={stage.name}
                  className="relative flex flex-1 flex-col items-start pb-8 sm:items-center sm:pb-0"
                >
                  {index < request.stages.length - 1 && (
                    <div
                      className={cn(
                        "absolute left-4 top-4 hidden h-0.5 w-full sm:left-1/2 sm:top-5 sm:block sm:h-0.5",
                        isCompleted ? "bg-primary" : "bg-border",
                      )}
                      aria-hidden="true"
                    />
                  )}
                  <div
                    className={cn(
                      "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2",
                      isCompleted
                        ? "border-primary bg-primary text-primary-foreground"
                        : isCurrent
                          ? "border-primary bg-background text-primary"
                          : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Circle className="h-3 w-3" aria-hidden="true" />
                    )}
                  </div>
                  <div className="mt-3 text-left sm:text-center">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isCurrent ? "text-primary" : "text-foreground",
                      )}
                    >
                      {stage.name}
                    </p>
                    {stage.completedAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(stage.completedAt)}
                      </p>
                    )}
                    {isCurrent && !stage.completedAt && (
                      <p className="mt-1 text-xs text-primary">Current stage</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          {request.notes && (
            <p className="mt-6 rounded-md bg-muted p-4 text-sm text-muted-foreground">
              {request.notes}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
