import { apiClient } from "@/lib/api-client";

export type EngineerTask = Record<string, unknown> & {
  taskId: string;
  processInstanceId: string;
  taskDefinitionKey: string;
  created: string;
  name: string;
  assignee: string;
  remark: string;
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

export function normalizeTask(task: Record<string, unknown>): EngineerTask {
  const name = text(task, "name", "title", "taskName") || "Assigned task";
  return {
    ...task,
    taskId: text(task, "taskId", "id", "key"),
    processInstanceId: text(task, "processInstanceId"),
    taskDefinitionKey: text(task, "taskDefinitionKey"),
    created: text(task, "created", "createdAt"),
    name,
    assignee: text(task, "assignee"),
    remark: text(task, "remark"),
  };
}
