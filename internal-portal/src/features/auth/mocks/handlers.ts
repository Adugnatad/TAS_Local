import { http, HttpResponse, delay } from "msw";
import type { OfficerRole } from "@/lib/constants";
import { randomDelay } from "@/lib/utils";
import type { SessionUser } from "../types";

const MOCK_USERS: Record<OfficerRole, SessionUser> = {
  officer: {
    id: "usr-officer-1",
    name: "Maria Santos",
    email: "maria.santos@coopbank.local",
    role: "officer",
  },
  supervisor: {
    id: "usr-supervisor-1",
    name: "Juan Dela Cruz",
    email: "juan.delacruz@coopbank.local",
    role: "supervisor",
  },
  admin: {
    id: "usr-admin-1",
    name: "Ana Reyes",
    email: "ana.reyes@coopbank.local",
    role: "admin",
  },
};

let currentSession: SessionUser | null = null;

export const authHandlers = [
  http.post("/api/auth/login", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as { role: OfficerRole; name?: string };
    const user = { ...MOCK_USERS[body.role] };
    if (body.name) {
      user.name = body.name;
    }
    currentSession = user;
    return HttpResponse.json(user);
  }),

  http.get("/api/auth/session", async () => {
    await delay(200);
    return HttpResponse.json(currentSession);
  }),

  http.post("/api/auth/logout", async () => {
    await delay(200);
    currentSession = null;
    return new HttpResponse(null, { status: 204 });
  }),
];

export function setMockSession(user: SessionUser | null) {
  currentSession = user;
}
