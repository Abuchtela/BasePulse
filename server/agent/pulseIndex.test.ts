import { describe, expect, it } from "vitest";
import { createPortfolioPlan } from "./pulseIndex";

const baseRequest = {
  objective:
    "Build a diversified technology and AI portfolio for long-term growth.",
  budgetUsd: 1_000,
  riskLevel: "balanced" as const,
  themes: ["technology", "ai"] as const,
  exclusions: ["crypto"],
  maxPositionPercent: 25,
  countryCode: "US",
};

describe("PulseIndex portfolio planner", () => {
  it("creates a complete capped simulation plan", () => {
    const plan = createPortfolioPlan({
      ...baseRequest,
      themes: [...baseRequest.themes],
    });

    expect(plan.agent).toBe("pulseindex");
    expect(plan.executionMode).toBe("simulation");
    expect(plan.totalPercent).toBe(100);
    expect(plan.totalUsd).toBe(1_000);
    expect(plan.holdings.every(holding => holding.weightPercent <= 25)).toBe(
      true
    );
    expect(plan.holdings.some(holding => holding.symbol === "COIN")).toBe(
      false
    );
  });

  it("blocks live execution for a U.S. person", () => {
    const plan = createPortfolioPlan({
      ...baseRequest,
      themes: [...baseRequest.themes],
    });
    const jurisdiction = plan.policyChecks.find(
      check => check.label === "Jurisdiction gate"
    );

    expect(plan.eligibleForLiveTokenizedStocks).toBe(false);
    expect(jurisdiction?.status).toBe("blocked");
  });

  it("requires provider verification outside the U.S.", () => {
    const plan = createPortfolioPlan({
      ...baseRequest,
      themes: [...baseRequest.themes],
      countryCode: "GB",
    });
    const jurisdiction = plan.policyChecks.find(
      check => check.label === "Jurisdiction gate"
    );

    expect(plan.executionMode).toBe("simulation");
    expect(jurisdiction?.status).toBe("notice");
  });
});
