import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import StatusPage from "@/app/(internal)/status/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }));
vi.mock("@/features/auth/hooks/useSession", () => ({
  useSession: () => ({
    user: {
      userType: "EMPLOYEE",
      roles: ["admin", "BankAdmin"],
      permissions: ["VIEW_ORGANIZATIONS"],
    },
    isAuthenticated: true,
    canAny: () => true,
  }),
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("StatusBadge", () => {
  it("renders organization status label", () => {
    render(<StatusBadge status="ACTIVE" />);
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
  });

  it("renders validation status", () => {
    render(<StatusBadge status="VALIDATED" />);
    expect(screen.getByText("VALIDATED")).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState title="No data" description="Try again later." />);
    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(screen.getByText("Try again later.")).toBeInTheDocument();
  });
});

describe("ErrorState", () => {
  it("renders error message and retry button", () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    screen.getByRole("button", { name: "Try again" }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe("StatusPage", () => {
  it("renders loan process oversight", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
    render(<StatusPage />, { wrapper });
    expect(await screen.findByText("Loan process oversight")).toBeInTheDocument();
    expect(await screen.findByText("No loan processes")).toBeInTheDocument();
  });
});
