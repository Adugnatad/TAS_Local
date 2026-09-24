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

export type EngineerProcess = Record<string, unknown> & {
  processInstanceId: string;
  status?: string;
  name?: string;
};

function text(task: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = task[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "";
}

function asRows(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"));
  }
  const record = data as { tasks?: unknown[]; items?: unknown[]; content?: unknown[]; processes?: unknown[] } | null;
  const rows = record?.tasks ?? record?.items ?? record?.content ?? record?.processes ?? [];
  return rows.filter((row): row is Record<string, unknown> => Boolean(row && typeof row === "object"));
}

export async function fetchEngineerTasks(): Promise<EngineerTask[]> {
  const data = await apiClient<unknown>("/engineer/tasks/mine");
  return asRows(data).map(normalizeTask);
}

export async function fetchEngineerProcesses(includeClosed = false): Promise<EngineerProcess[]> {
  const data = await apiClient<unknown>("/engineer/tasks/processes", {
    params: { includeClosed },
  });
  return asRows(data).map((row) => ({
    ...row,
    processInstanceId: text(row, "processInstanceId", "id", "coopstreamApplicationId"),
    status: text(row, "status", "processStatus", "state") || undefined,
    name: text(row, "name", "title", "processName") || undefined,
  }));
}

export async function fetchEngineerTask(taskId: string): Promise<EngineerTask> {
  const data = await apiClient<Record<string, unknown>>(
    `/engineer/tasks/${encodeURIComponent(taskId)}`,
  );
  return normalizeTask(data);
}

export function completeEngineerTask(taskId: string, body: FormData): Promise<unknown> {
  return apiClient(`/engineer/tasks/${encodeURIComponent(taskId)}/complete`, {
    method: "POST",
    body,
  });
}

export function completeEngineerEstimation(taskId: string, body: FormData): Promise<unknown> {
  return apiClient(
    `/engineer/tasks/${encodeURIComponent(taskId)}/complete-engineer-estimation`,
    { method: "POST", body },
  );
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
