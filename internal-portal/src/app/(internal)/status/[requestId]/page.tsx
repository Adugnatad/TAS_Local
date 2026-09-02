import { format, parseISO } from "date-fns";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { requestsFixture } from "@/features/status-viewer/mocks/fixtures";

function formatDate(value: string) {
  try {
    const date = value.includes("T") ? parseISO(value) : new Date(value);
    return format(date, "MMM d, yyyy 'at' h:mm a");
  } catch {
    return value;
  }
}

export default function StatusDetailPage({ params }: { params: { requestId: string } }) {
  const request = requestsFixture.find((item) => item.id === params.requestId);

  if (!request) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Request details
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{request.organizationName}</h1>
          <StatusBadge status={request.status} label={request.status.replaceAll("_", " ")} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Request</p>
          <p className="mt-1 font-medium">{request.id}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Type</p>
          <p className="mt-1 font-medium">{request.requestType}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Submitted</p>
          <p className="mt-1 font-medium">{formatDate(request.submittedAt)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Last updated</p>
          <p className="mt-1 font-medium">{formatDate(request.updatedAt)}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Reviewer</p>
          <p className="mt-1 font-medium">{request.reviewer}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Risk level</p>
          <p className="mt-1 font-medium">{request.riskLevel ?? "—"}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">Notes</p>
        <p className="mt-2 leading-6 text-foreground">{request.notes}</p>
      </div>
    </div>
  );
}
