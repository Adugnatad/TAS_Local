import { http, HttpResponse } from "msw";
import { randomDelay } from "@/lib/utils";
import type { Signatory, SignatoryRule } from "../types";
import {
  getRulesByCustomer,
  getSignatoriesByCustomer,
  signatoriesFixture,
  signatoryRulesFixture,
} from "./fixtures";
import { evaluateMatrixPreview } from "../utils/matrix-preview";

let signatories = [...signatoriesFixture];
let rules = [...signatoryRulesFixture];

export const signatoryMatrixHandlers = [
  http.get("/api/customers/:customerId/signatories", async ({ params }) => {
    await randomDelay();
    const data = signatories.filter((s) => s.customerId === params.customerId);
    return HttpResponse.json(data);
  }),

  http.post("/api/customers/:customerId/signatories", async ({ params, request }) => {
    await randomDelay();
    const body = (await request.json()) as Omit<Signatory, "id" | "customerId">;
    const newSignatory: Signatory = {
      id: `sig-${params.customerId}-${Date.now()}`,
      customerId: String(params.customerId),
      ...body,
      isActive: body.isActive ?? true,
    };
    signatories.push(newSignatory);
    return HttpResponse.json(newSignatory, { status: 201 });
  }),

  http.put("/api/customers/:customerId/signatories/:signatoryId", async ({ params, request }) => {
    await randomDelay();
    const body = (await request.json()) as Partial<Signatory>;
    const index = signatories.findIndex(
      (s) => s.id === params.signatoryId && s.customerId === params.customerId,
    );
    if (index === -1) {
      return HttpResponse.json({ message: "Signatory not found" }, { status: 404 });
    }
    signatories[index] = { ...signatories[index], ...body };
    return HttpResponse.json(signatories[index]);
  }),

  http.get("/api/customers/:customerId/signatory-rules", async ({ params }) => {
    await randomDelay();
    const data = rules.filter((r) => r.customerId === params.customerId);
    return HttpResponse.json(data);
  }),

  http.post("/api/customers/:customerId/signatory-rules", async ({ params, request }) => {
    await randomDelay();
    const body = (await request.json()) as Omit<SignatoryRule, "id" | "customerId">;
    const newRule: SignatoryRule = {
      id: `rule-${params.customerId}-${Date.now()}`,
      customerId: String(params.customerId),
      ...body,
    };
    rules.push(newRule);
    return HttpResponse.json(newRule, { status: 201 });
  }),

  http.put(
    "/api/customers/:customerId/signatory-rules/:ruleId",
    async ({ params, request }) => {
      await randomDelay();
      const body = (await request.json()) as Partial<SignatoryRule>;
      const index = rules.findIndex(
        (r) => r.id === params.ruleId && r.customerId === params.customerId,
      );
      if (index === -1) {
        return HttpResponse.json({ message: "Rule not found" }, { status: 404 });
      }
      rules[index] = { ...rules[index], ...body };
      return HttpResponse.json(rules[index]);
    },
  ),

  http.delete("/api/customers/:customerId/signatory-rules/:ruleId", async ({ params }) => {
    await randomDelay();
    const index = rules.findIndex(
      (r) => r.id === params.ruleId && r.customerId === params.customerId,
    );
    if (index === -1) {
      return HttpResponse.json({ message: "Rule not found" }, { status: 404 });
    }
    rules.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("/api/customers/:customerId/signatory-matrix/preview", async ({ params, request }) => {
    await randomDelay();
    const body = (await request.json()) as { amount: number };
    const customerSignatories = getSignatoriesByCustomer(String(params.customerId));
    const customerRules = getRulesByCustomer(String(params.customerId));
    const result = evaluateMatrixPreview(body.amount, customerSignatories, customerRules);
    return HttpResponse.json(result);
  }),
];

export function resetSignatoryMocks() {
  signatories = [...signatoriesFixture];
  rules = [...signatoryRulesFixture];
}
