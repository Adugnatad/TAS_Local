import type { RequestStage, RequestStatus, RequestType } from "@/lib/constants";
import { LOAN_STAGES, TRADE_STAGES } from "@/lib/constants";
import type { RequestStatusDetail, RequestStatusSummary } from "../types";
import { customersFixture } from "@/features/onboarding/mocks/fixtures";

const statuses: RequestStatus[] = ["in_progress", "completed", "rejected", "on_hold"];

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function getStageForStatus(
  type: RequestType,
  status: RequestStatus,
  index: number,
): RequestStage {
  const stages = type === "loan" ? LOAN_STAGES : TRADE_STAGES;
  if (status === "completed") return "Completed";
  if (status === "rejected") return stages[Math.min(2, stages.length - 2)];
  if (status === "on_hold") return "Signatory Check";
  return stages[Math.min(index % (stages.length - 1), stages.length - 2)];
}

export const requestsFixture: RequestStatusSummary[] = Array.from({ length: 24 }, (_, i) => {
  const customer = customersFixture[i % customersFixture.length];
  const type: RequestType = i % 3 === 0 ? "trade" : "loan";
  const status = statuses[i % statuses.length];
  const submittedDaysAgo = 20 - (i % 15);
  const updatedDaysAgo = Math.max(0, submittedDaysAgo - (i % 5));
  return {
    id: `req-${String(i + 1).padStart(3, "0")}`,
    customerId: customer.id,
    customerName: customer.legalName,
    type,
    currentStage: getStageForStatus(type, status, i),
    status,
    amount: [250000, 500000, 750000, 1000000, 2500000, 5000000, 10000000][i % 7],
    submittedAt: daysAgo(submittedDaysAgo),
    lastUpdatedAt: daysAgo(updatedDaysAgo),
  };
});

export function getRequestDetail(id: string): RequestStatusDetail | undefined {
  const summary = requestsFixture.find((r) => r.id === id);
  if (!summary) return undefined;

  const stages = (summary.type === "loan" ? LOAN_STAGES : TRADE_STAGES).map((name) => ({
    name,
    isCurrent: name === summary.currentStage,
    completedAt:
      name === summary.currentStage || summary.status === "completed"
        ? undefined
        : daysAgo(5),
  }));

  const currentIndex = stages.findIndex((s) => s.isCurrent);
  stages.forEach((stage, index) => {
    if (index < currentIndex || summary.status === "completed") {
      stage.completedAt = daysAgo(10 - index);
      stage.isCurrent = false;
    }
  });
  if (summary.status === "completed") {
    stages[stages.length - 1].isCurrent = true;
    stages[stages.length - 1].completedAt = summary.lastUpdatedAt;
  }

  return {
    ...summary,
    stages,
    notes:
      summary.status === "on_hold"
        ? "Awaiting additional signatory documentation."
        : summary.status === "rejected"
          ? "Request rejected during signatory verification."
          : undefined,
  };
}
