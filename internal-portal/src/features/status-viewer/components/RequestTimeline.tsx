import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { REQUEST_STATUS_LABELS } from "@/lib/constants";
import type { RequestStatusDetail } from "../types";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RequestTimelineProps {
  request: RequestStatusDetail;
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export function RequestTimeline({ request }: RequestTimelineProps) {
  const currentIndex = request.stages.findIndex((s) => s.isCurrent);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-xs text-muted-foreground">{request.id}</p>
              <CardTitle className="mt-1 text-lg">{request.customerName}</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {request.type}
              </Badge>
              <StatusBadge
                status={request.status}
                label={REQUEST_STATUS_LABELS[request.status]}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <dl className="grid gap-4 rounded-lg border bg-muted/30 px-4 py-3 sm:grid-cols-3">
            <MetaItem label="Amount" value={formatCurrency(request.amount)} />
            <MetaItem label="Submitted" value={formatDate(request.submittedAt)} />
            <MetaItem label="Last updated" value={formatDate(request.lastUpdatedAt)} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Request Progress</CardTitle>
          <CardDescription>
            Stage history across CoopStream and TSS for this request.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <ol className="relative space-y-0 border-l border-border pl-6">
            {request.stages.map((stage, index) => {
              const isCompleted =
                request.status === "completed" ||
                (currentIndex >= 0 && index < currentIndex);
              const isCurrent = stage.isCurrent;

              return (
                <li key={stage.name} className="relative pb-6 last:pb-0">
                  <span
                    className={cn(
                      "absolute -left-[1.65rem] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 bg-card",
                      isCompleted && "border-primary bg-primary",
                      isCurrent && !isCompleted && "border-primary",
                      !isCompleted && !isCurrent && "border-muted-foreground/35",
                    )}
                    aria-hidden="true"
                  />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <div>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isCurrent ? "text-primary" : "text-foreground",
                        )}
                      >
                        {stage.name}
                      </p>
                      {isCurrent && (
                        <p className="mt-0.5 text-xs text-primary">Current stage</p>
                      )}
                    </div>
                    {stage.completedAt && (
                      <time className="text-xs text-muted-foreground" dateTime={stage.completedAt}>
                        {formatDate(stage.completedAt)}
                      </time>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {request.notes && (
            <div className="mt-6 rounded-lg border border-border bg-muted/40 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Note
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">{request.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
