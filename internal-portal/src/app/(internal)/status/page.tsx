import { format, parseISO } from "date-fns";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { requestsFixture } from "@/features/status-viewer/mocks/fixtures";

function formatDate(value: string) {
  try {
    const date = value.includes("T") ? parseISO(value) : new Date(value);
    return format(date, "MMM d, yyyy");
  } catch {
    return value;
  }
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING_REVIEW: "Pending review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CHANGES_REQUESTED: "Changes requested",
  };

  return labels[status] ?? status.replaceAll("_", " ");
}

export default function StatusPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Monitoring
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Organization request statuses
          </h1>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">Request</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Organization</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Submitted</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Reviewer</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Notes</th>
            </tr>
          </thead>
          <tbody>
            {requestsFixture.map((request) => (
              <tr key={request.id} className="border-t align-top">
                <td className="px-4 py-3">
                  <Link
                    href={`/status/${request.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {request.id}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{request.organizationName}</div>
                  <div className="text-xs text-muted-foreground">{request.organizationTin}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{request.requestType}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(request.submittedAt)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{request.reviewer}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={request.status} label={statusLabel(request.status)} />
                </td>
                <td className="max-w-md px-4 py-3 text-muted-foreground">{request.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
