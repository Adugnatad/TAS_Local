"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ErrorState } from "@/components/shared/ErrorState";
import { completeEngineerTask, fetchEngineerTask, fetchEngineerTasks } from "../api";
import type { EngineerTask as Task } from "../api";

const fieldClass = "h-10 bg-background";
const emptyTasks: Task[] = [];
const APPOINTMENT_DATE_TASK_DEFINITION_KEY = "Activity_0wids8w";

export function isAppointmentDateTask(taskDefinitionKey: string): boolean {
  return taskDefinitionKey === APPOINTMENT_DATE_TASK_DEFINITION_KEY;
}

export function EngineerTasks() {
  const queryClient = useQueryClient();
  const tasksQuery = useQuery({ queryKey: ["engineer-tasks"], queryFn: fetchEngineerTasks });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [query, setQuery] = useState("");
  const detailQuery = useQuery({
    queryKey: ["engineer-task", selectedTask?.taskId],
    queryFn: () => fetchEngineerTask(selectedTask!.taskId),
    enabled: Boolean(selectedTask),
  });
  const completeMutation = useMutation({
    mutationFn: ({ taskId, body }: { taskId: string; body: FormData }) =>
      completeEngineerTask(taskId, body),
    onSuccess: async () => {
      setSelectedTask(null);
      await queryClient.invalidateQueries({ queryKey: ["engineer-tasks"] });
    },
  });
  const tasks = tasksQuery.data ?? emptyTasks;

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) =>
        `${task.name} ${task.taskId} ${task.taskDefinitionKey}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query, tasks],
  );

  if (tasksQuery.isLoading)
    return <div className="p-6 text-sm text-muted-foreground">Loading tasks...</div>;
  if (tasksQuery.isError) return <ErrorState onRetry={() => tasksQuery.refetch()} />;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Engineer tasks"
        description="Work assigned to you for collateral inspection and valuation."
        actions={
          <Badge variant="secondary" className="h-8 gap-2 px-3 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {tasks.length} active {tasks.length === 1 ? "task" : "tasks"}
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <section className="space-y-4" aria-labelledby="active-tasks-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="active-tasks-heading" className="text-lg font-semibold">
                Active queue
              </h2>
              <p className="text-sm text-muted-foreground">
                Select a task to continue the workflow.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tasks"
                className="pl-9"
              />
            </div>
          </div>

          {filteredTasks.length ? (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <button
                  key={task.taskId}
                  type="button"
                  onClick={() => setSelectedTask(task)}
                  className="group flex w-full items-start gap-4 rounded-lg border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/50 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{task.name}</h3>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {task.taskId}
                      </Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                      <span>Created {formatTaskDate(task.created)}</span>
                      <span>Definition {task.taskDefinitionKey || "-"}</span>
                    </div>
                  </div>
                  <ChevronRight className="mt-2 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                <h3 className="mt-4 font-semibold">No active tasks</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  You are all caught up. New assignments will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      {selectedTask && (
        <TaskPanel
          task={detailQuery.data ?? selectedTask}
          onClose={() => setSelectedTask(null)}
          onComplete={(body) => completeMutation.mutate({ taskId: selectedTask.taskId, body })}
          isSubmitting={completeMutation.isPending}
          error={completeMutation.error}
        />
      )}
    </div>
  );
}

function TaskPanel({
  task,
  onClose,
  onComplete,
  isSubmitting,
  error,
}: {
  task: Task;
  onClose: () => void;
  onComplete: (body: FormData) => void;
  isSubmitting: boolean;
  error: Error | null;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const isAppointmentDate = isAppointmentDateTask(task.taskDefinitionKey);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-foreground/30 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-panel-title"
    >
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-background shadow-2xl">
        <div className="flex items-start justify-between border-b px-6 py-5">
          <div>
            <button
              type="button"
              onClick={onClose}
              className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to tasks
            </button>
            <h2 id="task-panel-title" className="text-xl font-semibold">
              {task.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {task.taskId} · {task.taskDefinitionKey || "Workflow task"}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close task">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onComplete(new FormData(event.currentTarget));
            }}
            className="space-y-6"
          >
            <Card className="bg-muted/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Task context</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Process instance</p>
                  <p className="mt-1 break-all font-medium">{task.processInstanceId || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Assignee</p>
                  <p className="mt-1 font-medium">{task.assignee || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="mt-1 font-medium">{formatTaskDate(task.created)}</p>
                </div>
                {task.remark && (
                  <div>
                    <p className="text-xs text-muted-foreground">Remark</p>
                    <p className="mt-1 font-medium">{task.remark}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            {isAppointmentDate ? (
              <DateFields date={date} setDate={setDate} />
            ) : (
              <EstimationFields />
            )}
            <Separator />
            {error && <p className="text-sm text-destructive">{error.message}</p>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Complete task"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function DateFields({ date, setDate }: { date: string; setDate: (value: string) => void }) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-semibold">Tentative estimation date</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose the tentative date for the estimation workflow.
        </p>
      </div>
      <div className="max-w-xs space-y-2">
        <Label htmlFor="task-date">Estimation date</Label>
        <Input
          id="task-date"
          name="date"
          type="date"
          min={new Date().toISOString().slice(0, 10)}
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className={fieldClass}
        />
      </div>
    </section>
  );
}

function formatTaskDate(value: string): string {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function EstimationFields() {
  const [buildings, setBuildings] = useState(["Main building"]);

  return (
    <div className="space-y-7">
      <section className="space-y-4">
        <div>
          <h3 className="font-semibold">Property details</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Record the plot and general-use details from your assessment.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="plot-area">Plot area (m²)</Label>
            <Input
              id="plot-area"
              type="number"
              min="1"
              placeholder="e.g. 450"
              className={fieldClass}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="town">Property town</Label>
            <select
              id="town"
              className={`${fieldClass} w-full rounded-md border px-3 text-sm`}
              defaultValue=""
            >
              <option value="" disabled>
                Select town
              </option>
              <option>Finfinne Border A1</option>
              <option>Major Cities C1</option>
              <option>Secondary Major Cities D1</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="use">General use</Label>
            <Input id="use" placeholder="e.g. Commercial" className={fieldClass} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grade">Plot grade</Label>
            <select
              id="grade"
              className={`${fieldClass} w-full rounded-md border px-3 text-sm`}
              defaultValue="Excellent"
            >
              <option>Excellent</option>
              <option>Good</option>
              <option>Average</option>
            </select>
          </div>
        </div>
      </section>
      <Separator />
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="font-semibold">Buildings</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add each building included in the valuation.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setBuildings([...buildings, `Building ${buildings.length + 1}`])}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add building
          </Button>
        </div>
        <div className="space-y-3">
          {buildings.map((building, index) => (
            <div
              key={building}
              className="grid gap-3 rounded-md border p-4 sm:grid-cols-[1fr_110px_110px_auto]"
            >
              <div className="space-y-2 sm:col-span-4">
                <Label htmlFor={`building-${index}`}>Building type</Label>
                <Input id={`building-${index}`} defaultValue={building} className={fieldClass} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`length-${index}`}>Length (m)</Label>
                <Input
                  id={`length-${index}`}
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="0"
                  required
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`width-${index}`}>Width (m)</Label>
                <Input
                  id={`width-${index}`}
                  type="number"
                  min="0.1"
                  step="0.1"
                  placeholder="0"
                  required
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`floors-${index}`}>Floors</Label>
                <Input
                  id={`floors-${index}`}
                  type="number"
                  min="1"
                  placeholder="1"
                  required
                  className={fieldClass}
                />
              </div>
              {buildings.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="self-end text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    setBuildings(buildings.filter((_, itemIndex) => itemIndex !== index))
                  }
                  aria-label={`Remove ${building}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>
      <Separator />
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="mcf">Material cost factor (MCF)</Label>
          <Input
            id="mcf"
            type="number"
            min="0.1"
            step="0.1"
            placeholder="1.00"
            required
            className={fieldClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pef">Price escalation factor (PEF)</Label>
          <Input
            id="pef"
            type="number"
            min="0.1"
            step="0.1"
            placeholder="1.00"
            required
            className={fieldClass}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="remarks">
            Engineer remarks{" "}
            <span className="font-normal text-muted-foreground">(optional, 100 characters)</span>
          </Label>
          <textarea
            id="remarks"
            maxLength={100}
            className="min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Add a short note about the assessment."
          />
        </div>
      </section>
    </div>
  );
}
