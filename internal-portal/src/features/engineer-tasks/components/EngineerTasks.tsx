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
const buildingNameOptions = [
  "G+1 and G+2",
  "G+3 and G+4",
  "G+5 and G+6",
  "G+7 and Above",
  "Single Story Building (higher Villa)",
  "Wood & Hobe Villa",
  "Lower Villa",
  "Multipurpose Halls H<=4m",
  "Multipurpose Halls H=5m",
  "Multipurpose Halls H=6.5m",
  "Multipurpose Halls H=9.5m",
  "Multipurpose Halls H>=10.5m",
];
const propertyTownOptions = [
  "Finfinne Border A1",
  "Surrounding Finfine B1",
  "Surrounding Finfine B2",
  "Surrounding Finfine B3",
  "Major Cities C1",
  "Major Cities C2",
  "Secondary Major Cities D1",
  "Secondary Major Cities D2",
];
const materialOptions = {
  Foundation: ["RC", "RC - Best workmanship", "Block", "Stone"],
  Roofing: ["Decra", "RC", "EGA", "Corrugated iron", "Similar tiles"],
  "Metal Work": ["Aluminum profile", "Iron", "Steel", "Stainless steel"],
  Floor: ["Granite", "Marble", "Ceramic", "Parquet", "Porcelain"],
};

export function isAppointmentDateTask(taskDefinitionKey: string): boolean {
  return taskDefinitionKey === APPOINTMENT_DATE_TASK_DEFINITION_KEY;
}

export function buildEstimationCompletionBody(formData: FormData): FormData {
  const buildingKeys = [
    "buildingName",
    "buildingCategory",
    "buildingLength",
    "buildingWidth",
    "buildingNumFloors",
    "confirmedGrade",
    "isUnderConstruction",
    "hasBasement",
    "foundationMaterials",
    "roofingMaterials",
    "floorMaterials",
    "metalWorkMaterials",
    "incompleteComponents",
    "cherryHopperArea",
    "fermentationTanksArea",
    "washingChannelsLength",
    "coffeeDrierArea",
    "sitePreparationArea",
    "forecourtArea",
    "canopyArea",
    "numPumpIslands",
    "numUgt30m3",
    "numUgt50m3",
  ];
  const propertyKeys = [
    "plotArea",
    "propertyTown",
    "generalUse",
    "plotGrade",
    "fencePercent",
    "septicPercent",
    "externalWorksPercent",
    "consultancyPercent",
    "waterTankCost",
    "hasElevator",
    "elevatorStops",
    "mcf",
    "pef",
    "remarks",
  ];
  const booleanKeys = new Set(["isUnderConstruction", "hasBasement", "hasElevator"]);
  const materialKeys = new Set([
    "foundationMaterials",
    "roofingMaterials",
    "floorMaterials",
    "metalWorkMaterials",
    "incompleteComponents",
  ]);
  const valueFor = (key: string, index?: number) => {
    const value = formData.getAll(key)[index ?? 0];
    return value ?? (booleanKeys.has(key) ? false : null);
  };
  const buildingCount = Math.max(1, formData.getAll("buildingName").length);
  const buildings = Array.from({ length: buildingCount }, (_, index) => {
    const building = Object.fromEntries(
      buildingKeys.map((key) => {
        const value = valueFor(key, index);
        return [
          key,
          materialKeys.has(key)
            ? typeof value === "string" && value
              ? value
                  .split(",")
                  .map((material) => material.trim())
                  .filter(Boolean)
              : []
            : value,
        ];
      }),
    );
    return building;
  });
  const request: Record<string, unknown> = Object.fromEntries(
    propertyKeys.map((key) => [key, valueFor(key)]),
  );
  request.buildings = buildings;
  const body = new FormData();

  body.append("request", JSON.stringify(request));
  return body;
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
              const formData = new FormData(event.currentTarget);
              onComplete(isAppointmentDate ? formData : buildEstimationCompletionBody(formData));
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
          name="appointment_date"
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
  const [buildings, setBuildings] = useState([0]);

  return (
    <div className="space-y-7">
      <section className="space-y-4">
        <div>
          <h3 className="font-semibold">Property details</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="plot-area">Plot Area (sqm)</Label>
            <Input id="plot-area" name="plotArea" type="number" min="0" className={fieldClass} />
          </div>
          <SelectField
            id="property-town"
            name="propertyTown"
            label="Property Town"
            options={propertyTownOptions.map((town): [string, string] => [town, town])}
          />
          <SelectField
            id="general-use"
            name="generalUse"
            label="General Use"
            options={[
              ["residential", "Residential"],
              ["commercial", "Commercial"],
              ["industrial", "Industrial"],
              ["mixedUse", "Mixed-Use"],
            ]}
          />
          <SelectField
            id="plot-grade"
            name="plotGrade"
            label="Plot Grade"
            options={[
              ["grade1", "Grade 1"],
              ["grade2", "Grade 2"],
              ["grade3", "Grade 3"],
              ["grade4", "Grade 4"],
            ]}
          />
        </div>
      </section>
      <Separator />
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="font-semibold">Building details</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add each building included in the valuation.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setBuildings([...buildings, Math.max(...buildings) + 1])}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add building
          </Button>
        </div>
        <div className="space-y-4">
          {buildings.map((buildingId, index) => (
            <BuildingFields
              key={buildingId}
              index={index}
              canRemove={buildings.length > 1}
              onRemove={() => setBuildings(buildings.filter((id) => id !== buildingId))}
            />
          ))}
        </div>
      </section>
      <Separator />
      <section className="space-y-4">
        <h3 className="font-semibold">Other costs</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField id="fence-percent" name="fencePercent" label="Fence (%)" />
          <NumberField id="septic-percent" name="septicPercent" label="Septic (%)" />
          <NumberField
            id="external-works-percent"
            name="externalWorksPercent"
            label="External Works (%)"
          />
          <NumberField id="consultancy-percent" name="consultancyPercent" label="Consultancy (%)" />
          <NumberField id="water-tank-cost" name="waterTankCost" label="Water Tank Cost ($)" />
        </div>
      </section>
      <Separator />
      <section className="space-y-4">
        <h3 className="font-semibold">Financial factors</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField id="mcf" name="mcf" label="MCF (Market Condition Factor)" />
          <NumberField id="pef" name="pef" label="PEF (Property Enhancement Factor)" />
        </div>
      </section>
      <Separator />
      <section className="space-y-2">
        <h3 className="font-semibold">Remarks</h3>
        <Label htmlFor="remarks">Remarks</Label>
        <textarea
          id="remarks"
          name="remarks"
          className="min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </section>
    </div>
  );
}

function BuildingFields({
  index,
  canRemove,
  onRemove,
}: {
  index: number;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const [buildingCategory, setBuildingCategory] = useState("");
  const [hasElevator, setHasElevator] = useState(false);
  const fieldId = (name: string) => `${name}-${index}`;

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Building {index + 1}</h4>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label={`Remove building ${index + 1}`}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id={fieldId("building-name")}
          name="buildingName"
          label="Name"
          options={buildingNameOptions.map((name): [string, string] => [name, name])}
        />
        <SelectField
          id={fieldId("building-category")}
          name="buildingCategory"
          label="Category"
          value={buildingCategory}
          onChange={setBuildingCategory}
          options={[
            ["residential", "Residential"],
            ["commercial", "Commercial"],
            ["industrial", "Industrial"],
            ["coffeeWashingSite", "Coffee Washing Site"],
            ["fuelStation", "Fuel Station"],
          ]}
        />
        <NumberField id={fieldId("building-length")} name="buildingLength" label="Length (m)" />
        <NumberField id={fieldId("building-width")} name="buildingWidth" label="Width (m)" />
        <NumberField
          id={fieldId("building-floors")}
          name="buildingNumFloors"
          label="Number of Floors"
        />
        <SelectField
          id={fieldId("confirmed-grade")}
          name="confirmedGrade"
          label="Confirmed Grade"
          options={[
            ["gradeA", "Grade A"],
            ["gradeB", "Grade B"],
            ["gradeC", "Grade C"],
          ]}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <CheckboxField
          id={fieldId("under-construction")}
          name="isUnderConstruction"
          label="Is Under Construction"
        />
        <CheckboxField id={fieldId("has-basement")} name="hasBasement" label="Has Basement" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <MaterialField
          id={fieldId("foundation-materials")}
          name="foundationMaterials"
          label="Foundation"
          options={materialOptions.Foundation}
        />
        <MaterialField
          id={fieldId("roofing-materials")}
          name="roofingMaterials"
          label="Roofing"
          options={materialOptions.Roofing}
        />
        <MaterialField
          id={fieldId("floor-materials")}
          name="floorMaterials"
          label="Floor"
          options={materialOptions.Floor}
        />
        <MaterialField
          id={fieldId("metalwork-materials")}
          name="metalWorkMaterials"
          label="Metal Work"
          options={materialOptions["Metal Work"]}
        />
        <div className="sm:col-span-2">
          <TagField
            id={fieldId("incomplete-components")}
            name="incompleteComponents"
            label="Incomplete Components"
          />
        </div>
      </div>
      {(buildingCategory === "coffeeWashingSite" || buildingCategory === "fuelStation") && (
        <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
          {buildingCategory === "coffeeWashingSite" && (
            <>
              <NumberField
                id={fieldId("cherry-hopper-area")}
                name="cherryHopperArea"
                label="Cherry Hopper Area (sqm)"
              />
              <NumberField
                id={fieldId("fermentation-tanks-area")}
                name="fermentationTanksArea"
                label="Fermentation Tanks Area (sqm)"
              />
              <NumberField
                id={fieldId("washing-channels-length")}
                name="washingChannelsLength"
                label="Washing Channels Length (m)"
              />
              <NumberField
                id={fieldId("coffee-drier-area")}
                name="coffeeDrierArea"
                label="Coffee Drier Area (sqm)"
              />
            </>
          )}
          {buildingCategory === "fuelStation" && (
            <>
              <NumberField
                id={fieldId("site-preparation-area")}
                name="sitePreparationArea"
                label="Site Preparation Area (sqm)"
              />
              <NumberField
                id={fieldId("forecourt-area")}
                name="forecourtArea"
                label="Forecourt Area (sqm)"
              />
              <NumberField
                id={fieldId("canopy-area")}
                name="canopyArea"
                label="Canopy Area (sqm)"
              />
              <NumberField
                id={fieldId("num-pump-islands")}
                name="numPumpIslands"
                label="Number of Pump Islands"
              />
              <NumberField
                id={fieldId("num-ugt-30")}
                name="numUgt30m3"
                label="Number of UGT 30m³"
              />
              <NumberField
                id={fieldId("num-ugt-50")}
                name="numUgt50m3"
                label="Number of UGT 50m³"
              />
            </>
          )}
        </div>
      )}
      <div className="border-t pt-4">
        <CheckboxField
          id={fieldId("has-elevator")}
          name="hasElevator"
          label="Has Elevator"
          checked={hasElevator}
          onChange={(event) => setHasElevator(event.target.checked)}
        />
        {hasElevator && (
          <div className="mt-4 max-w-xs">
            <NumberField
              id={fieldId("elevator-stops")}
              name="elevatorStops"
              label="Elevator Stops"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function NumberField({ id, name, label }: { id: string; name: string; label: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type="number" min="0" className={fieldClass} />
    </div>
  );
}

function SelectField({
  id,
  name,
  label,
  options,
  value,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  options: [string, string][];
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className={`${fieldClass} w-full rounded-md border px-3 text-sm`}
        defaultValue={value === undefined ? "" : undefined}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxField({
  id,
  name,
  label,
  checked,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  checked?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm">
      <input id={id} name={name} type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

function TagField({ id, name, label }: { id: string; name: string; label: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        placeholder="Enter values separated by commas"
        className={fieldClass}
      />
    </div>
  );
}

function MaterialField({
  id,
  name,
  label,
  options,
}: {
  id: string;
  name: string;
  label: string;
  options: string[];
}) {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <input type="hidden" name={name} value={selected.join(",")} />
      <div id={id} className="grid gap-2 rounded-md border p-3 sm:grid-cols-2">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={(event) =>
                setSelected((current) =>
                  event.target.checked
                    ? [...current, option]
                    : current.filter((value) => value !== option),
                )
              }
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
