"use client";

import { useState } from "react";
import { useMatrixAudit } from "../hooks";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function MatrixAuditPanel({ orgId }: { orgId: string }) {
  const audit = useMatrixAudit(orgId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (audit.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (audit.isError) return <ErrorState onRetry={() => audit.refetch()} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Audit history</h2>
        <p className="text-sm text-muted-foreground">
          Recent changes to signatory groups, members, and approval rules.
        </p>
      </div>

      {!audit.data?.length ? (
        <EmptyState title="No audit entries" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Changed by</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {audit.data.map((entry) => (
              <TableRow key={entry.id} className="group">
                <TableCell className="text-sm">
                  {new Date(entry.changedAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-sm">
                  {entry.entityType}
                  <span className="text-muted-foreground"> · {entry.entityId}</span>
                </TableCell>
                <TableCell>{entry.action}</TableCell>
                <TableCell className="max-w-xs truncate text-sm">{entry.summary}</TableCell>
                <TableCell className="text-sm">
                  {entry.changedByName ?? entry.changedBy}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setExpandedId(expandedId === entry.id ? null : entry.id)
                    }
                  >
                    {expandedId === entry.id ? "Hide" : "Details"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {audit.data
              .filter((entry) => expandedId === entry.id)
              .map((entry) => (
                <TableRow key={`${entry.id}-detail`}>
                  <TableCell colSpan={6} className="bg-muted/30">
                    <div className="grid gap-4 sm:grid-cols-2 text-xs">
                      <div>
                        <p className="font-medium mb-1">Before</p>
                        <pre className="overflow-auto rounded bg-background p-2">
                          {JSON.stringify(entry.before, null, 2) ?? "—"}
                        </pre>
                      </div>
                      <div>
                        <p className="font-medium mb-1">After</p>
                        <pre className="overflow-auto rounded bg-background p-2">
                          {JSON.stringify(entry.after, null, 2) ?? "—"}
                        </pre>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
