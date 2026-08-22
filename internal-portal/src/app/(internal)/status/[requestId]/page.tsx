"use client";

import { useParams } from "next/navigation";
import { useRequest } from "@/features/status-viewer/hooks/useRequests";
import { RequestTimeline } from "@/features/status-viewer/components/RequestTimeline";
import { Breadcrumbs } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";

export default function RequestDetailPage() {
  const params = useParams();
  const requestId = String(params.requestId);
  const { data: request, isLoading, isError, refetch } = useRequest(requestId);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Status Viewer", href: "/status" },
          { label: requestId },
        ]}
      />
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {request && <RequestTimeline request={request} />}
    </div>
  );
}
