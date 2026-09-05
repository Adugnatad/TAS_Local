import { apiClient } from "@/lib/api-client";

export type EngineerTask = Record<string, unknown> & {
  id: string;
  kind: "estimation" | "appointment";
  name: string;
  description: string;
  collateralId: string;
  collateralType: string;
  location: string;
  received: string;
};

function text(task: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = task[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "";
}

export async function fetchEngineerTasks(): Promise<EngineerTask[]> {
  const data = await apiClient<unknown>("/my-organization/loan-tracking/tasks");
  const rows = Array.isArray(data)
    ? data
    : ((data as { tasks?: unknown[]; items?: unknown[]; content?: unknown[] } | null)?.tasks ??
      (data as { items?: unknown[] } | null)?.items ??
      (data as { content?: unknown[] } | null)?.content ??
      []);
  return rows
    .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"))
    .map(normalizeTask);
}

export async function fetchEngineerTask(taskId: string): Promise<EngineerTask> {
  const data = await apiClient<Record<string, unknown>>(
    `/my-organization/loan-tracking/tasks/${encodeURIComponent(taskId)}`,
  );
  return normalizeTask(data);
}

export function completeEngineerTask(taskId: string, body: FormData): Promise<unknown> {
  return apiClient(`/my-organization/loan-tracking/tasks/${encodeURIComponent(taskId)}/complete`, {
    method: "POST",
    body,
  });
}

function normalizeTask(task: Record<string, unknown>): EngineerTask {
  const name = text(task, "name", "title", "taskName") || "Assigned task";
  const kind = text(task, "kind", "taskType", "type").toLowerCase().includes("appoint")
    ? "appointment"
    : name.toLowerCase().includes("appoint")
      ? "appointment"
      : "estimation";
  return {
    ...task,
    id: text(task, "id", "taskId", "key"),
    name,
    kind,
    description: text(task, "description", "taskDescription"),
    collateralId: text(task, "collateralId", "collateral_id"),
    collateralType: text(task, "collateralType", "collateral_type"),
    location: text(task, "location", "propertyLocation"),
    received: text(task, "received", "createdAt", "created", "assignedAt"),
  };
}
