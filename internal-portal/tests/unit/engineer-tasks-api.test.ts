import { describe, expect, it } from "vitest";
import { normalizeTask } from "@/features/engineer-tasks/api";
import { isAppointmentDateTask } from "@/features/engineer-tasks/components/EngineerTasks";

describe("engineer task normalization", () => {
  it("maps the workflow task contract without legacy collateral fields", () => {
    const task = normalizeTask({
      taskId: "111bcd15-a83a-11f1-bade-121b51a345ac",
      processInstanceId: "d23273d9-a839-11f1-bade-121b51a345ac",
      taskDefinitionKey: "Activity_0wids8w",
      created: "2026-09-04T08:24:37.380+0000",
      name: "Set Tentative Estimation Date",
      assignee: "180",
      remark: null,
    });

    expect(task).toMatchObject({
      taskId: "111bcd15-a83a-11f1-bade-121b51a345ac",
      processInstanceId: "d23273d9-a839-11f1-bade-121b51a345ac",
      taskDefinitionKey: "Activity_0wids8w",
      created: "2026-09-04T08:24:37.380+0000",
      name: "Set Tentative Estimation Date",
      assignee: "180",
      remark: "",
    });
    expect(task).not.toHaveProperty("id");
    expect(task).not.toHaveProperty("collateralId");
  });

  it("selects the appointment form from the task definition key", () => {
    expect(isAppointmentDateTask("Activity_0wids8w")).toBe(true);
    expect(isAppointmentDateTask("estimation-task-definition")).toBe(false);
  });
});
