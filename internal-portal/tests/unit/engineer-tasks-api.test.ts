import { describe, expect, it } from "vitest";
import { normalizeTask } from "@/features/engineer-tasks/api";
import {
  buildEstimationCompletionBody,
  isAppointmentDateTask,
} from "@/features/engineer-tasks/components/EngineerTasks";

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

  it("wraps estimation fields in a stringified request payload", () => {
    const formData = new FormData();
    formData.append("plotArea", "450");
    formData.append("propertyTown", "Major Cities C1");
    formData.append("generalUse", "commercial");
    formData.append("plotGrade", "grade2");
    formData.append("buildingName", "Main building");
    formData.append("buildingCategory", "commercial");
    formData.append("buildingLength", "20");
    formData.append("buildingWidth", "10");
    formData.append("buildingNumFloors", "2");
    formData.append("foundationMaterials", "RC,Block");
    formData.append("roofingMaterials", "RC");
    formData.append("floorMaterials", "Granite, Ceramic, Porcelain");
    formData.append("metalWorkMaterials", "");
    formData.append("buildingName", "Annex");
    formData.append("buildingCategory", "industrial");
    formData.append("buildingLength", "8");
    formData.append("buildingWidth", "6");
    formData.append("buildingNumFloors", "1");
    formData.append("mcf", "1.2");
    formData.append("pef", "1.1");
    formData.append("remarks", "Reviewed on site");

    const body = buildEstimationCompletionBody(formData);

    expect([...body.keys()]).toEqual(["request"]);
    expect(JSON.parse(body.get("request") as string)).toMatchObject({
      plotArea: "450",
      propertyTown: "Major Cities C1",
      generalUse: "commercial",
      plotGrade: "grade2",
      buildings: [
        expect.objectContaining({
          buildingName: "Main building",
          buildingCategory: "commercial",
          buildingLength: "20",
          foundationMaterials: ["RC", "Block"],
          roofingMaterials: ["RC"],
          floorMaterials: ["Granite", "Ceramic", "Porcelain"],
          metalWorkMaterials: [],
        }),
        expect.objectContaining({
          buildingName: "Annex",
          buildingCategory: "industrial",
          buildingLength: "8",
        }),
      ],
      mcf: "1.2",
      pef: "1.1",
      remarks: "Reviewed on site",
    });
  });
});
