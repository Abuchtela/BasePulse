import { z } from "zod";

export const portfolioRequestSchema = z.object({
  objective: z.string().trim().min(10).max(500),
  budgetUsd: z.number().min(10).max(1_000_000),
  riskLevel: z.enum(["conservative", "balanced", "growth"]),
  themes: z
    .array(z.enum(["broad-market", "technology", "ai", "consumer", "income"]))
    .max(5),
  exclusions: z.array(z.string().trim().min(1).max(40)).max(10),
  maxPositionPercent: z.number().int().min(10).max(50),
  countryCode: z
    .string()
    .trim()
    .length(2)
    .transform(value => value.toUpperCase()),
});

export type PortfolioRequest = z.infer<typeof portfolioRequestSchema>;

export type PortfolioHolding = {
  symbol: string;
  name: string;
  weightPercent: number;
  amountUsd: number;
  rationale: string;
  tokenStatus: "simulation-only";
};

export type PortfolioPlan = {
  id: string;
  createdAt: string;
  agent: "pulseindex";
  network: "base-sepolia";
  executionMode: "simulation";
  eligibleForLiveTokenizedStocks: boolean;
  holdings: PortfolioHolding[];
  totalPercent: number;
  totalUsd: number;
  policyChecks: Array<{
    label: string;
    status: "pass" | "blocked" | "notice";
    detail: string;
  }>;
  warnings: string[];
};

type Asset = {
  symbol: string;
  name: string;
  themes: PortfolioRequest["themes"];
  risk: 1 | 2 | 3;
  keywords: string[];
};

// This is deliberately a small, static demo universe. No item represents a
// verified Coinbase token contract or live market listing.
const DEMO_UNIVERSE: Asset[] = [
  {
    symbol: "SPY",
    name: "S&P 500 ETF",
    themes: ["broad-market"],
    risk: 1,
    keywords: ["index", "etf", "broad market"],
  },
  {
    symbol: "MSFT",
    name: "Microsoft",
    themes: ["technology", "ai"],
    risk: 2,
    keywords: ["software", "cloud"],
  },
  {
    symbol: "NVDA",
    name: "NVIDIA",
    themes: ["technology", "ai"],
    risk: 3,
    keywords: ["chips", "semiconductor"],
  },
  {
    symbol: "AMZN",
    name: "Amazon",
    themes: ["technology", "consumer"],
    risk: 3,
    keywords: ["retail", "commerce"],
  },
  {
    symbol: "KO",
    name: "Coca-Cola",
    themes: ["consumer", "income"],
    risk: 1,
    keywords: ["beverage"],
  },
  {
    symbol: "JNJ",
    name: "Johnson & Johnson",
    themes: ["income"],
    risk: 1,
    keywords: ["healthcare", "medical"],
  },
  {
    symbol: "COIN",
    name: "Coinbase",
    themes: ["technology"],
    risk: 3,
    keywords: ["crypto", "digital assets"],
  },
  {
    symbol: "AAPL",
    name: "Apple",
    themes: ["technology", "consumer"],
    risk: 2,
    keywords: ["devices", "hardware"],
  },
];

const riskTarget: Record<PortfolioRequest["riskLevel"], number> = {
  conservative: 1,
  balanced: 2,
  growth: 3,
};

function isExcluded(asset: Asset, exclusions: string[]) {
  const searchable = [asset.symbol, asset.name, ...asset.keywords]
    .join(" ")
    .toLowerCase();
  return exclusions.some(exclusion =>
    searchable.includes(exclusion.toLowerCase())
  );
}

function scoreAsset(asset: Asset, request: PortfolioRequest) {
  const target = riskTarget[request.riskLevel];
  const riskScore = 4 - Math.abs(target - asset.risk);
  const themeMatches = request.themes.filter(theme =>
    asset.themes.includes(theme)
  ).length;
  return riskScore + themeMatches * 3;
}

function allocateWeights(count: number, maxPositionPercent: number): number[] {
  const base = Math.floor(100 / count);
  const weights = Array.from({ length: count }, () =>
    Math.min(base, maxPositionPercent)
  );
  let remaining = 100 - weights.reduce((sum, weight) => sum + weight, 0);

  for (
    let index = 0;
    remaining > 0 && index < weights.length;
    index = (index + 1) % weights.length
  ) {
    if (weights[index] < maxPositionPercent) {
      weights[index] += 1;
      remaining -= 1;
    }

    if (
      index === weights.length - 1 &&
      weights.every(weight => weight >= maxPositionPercent)
    ) {
      break;
    }
  }

  return weights;
}

function planId(request: PortfolioRequest) {
  const source = `${request.objective}:${request.budgetUsd}:${request.countryCode}:${Date.now()}`;
  let hash = 0;
  for (const character of source)
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return `pi_${hash.toString(16).padStart(8, "0")}`;
}

export function createPortfolioPlan(
  rawRequest: PortfolioRequest
): PortfolioPlan {
  const request = portfolioRequestSchema.parse(rawRequest);
  const desiredCount = Math.ceil(100 / request.maxPositionPercent);
  const themeSet: PortfolioRequest["themes"] =
    request.themes.length > 0 ? request.themes : ["broad-market"];

  let candidates = DEMO_UNIVERSE.filter(
    asset => !isExcluded(asset, request.exclusions)
  ).sort(
    (a, b) =>
      scoreAsset(b, { ...request, themes: themeSet }) -
      scoreAsset(a, { ...request, themes: themeSet })
  );

  const warnings: string[] = [
    "Prototype output uses a static demonstration universe, not live prices or verified token contracts.",
    "This plan is educational software output and is not investment advice or an offer to trade securities.",
  ];

  const selectionCount = Math.min(
    candidates.length,
    Math.max(desiredCount, Math.min(5, candidates.length))
  );
  candidates = candidates.slice(0, selectionCount);

  if (candidates.length < desiredCount) {
    throw new Error(
      "The exclusions leave too few demo assets to satisfy the maximum position limit."
    );
  }

  const weights = allocateWeights(
    candidates.length,
    request.maxPositionPercent
  );
  if (weights.reduce((sum, weight) => sum + weight, 0) !== 100) {
    throw new Error(
      "The maximum position limit cannot produce a complete allocation with the available demo assets."
    );
  }

  const isUsPerson = request.countryCode === "US";
  const holdings = candidates.map((asset, index) => {
    const matchedThemes = asset.themes.filter(theme =>
      themeSet.includes(theme)
    );
    const rationale = matchedThemes.length
      ? `Matches ${matchedThemes.join(" and ")} preferences with a risk profile aligned to ${request.riskLevel}.`
      : `Adds diversification while staying within the ${request.maxPositionPercent}% position limit.`;

    return {
      symbol: asset.symbol,
      name: asset.name,
      weightPercent: weights[index],
      amountUsd: Number(
        ((request.budgetUsd * weights[index]) / 100).toFixed(2)
      ),
      rationale,
      tokenStatus: "simulation-only" as const,
    };
  });

  if (isUsPerson) {
    warnings.unshift(
      "Live Coinbase tokenized stocks are unavailable to U.S. persons; this request is locked to simulation."
    );
  } else {
    warnings.unshift(
      "Country entry alone does not establish eligibility. A regulated provider must verify the user before any live execution."
    );
  }

  return {
    id: planId(request),
    createdAt: new Date().toISOString(),
    agent: "pulseindex",
    network: "base-sepolia",
    executionMode: "simulation",
    eligibleForLiveTokenizedStocks: false,
    holdings,
    totalPercent: holdings.reduce(
      (sum, holding) => sum + holding.weightPercent,
      0
    ),
    totalUsd: Number(
      holdings.reduce((sum, holding) => sum + holding.amountUsd, 0).toFixed(2)
    ),
    policyChecks: [
      {
        label: "Jurisdiction gate",
        status: isUsPerson ? "blocked" : "notice",
        detail: isUsPerson
          ? "U.S. person: live tokenized-stock execution blocked."
          : "Non-U.S. country supplied; provider KYC and jurisdiction verification still required.",
      },
      {
        label: "Position limit",
        status: "pass",
        detail: `No position exceeds ${request.maxPositionPercent}% of the simulated portfolio.`,
      },
      {
        label: "Execution safety",
        status: "pass",
        detail:
          "Simulation mode only; no wallet transaction or asset purchase is created.",
      },
    ],
    warnings,
  };
}

export const pulseIndexDemoUniverse = DEMO_UNIVERSE.map(
  ({ symbol, name, themes, risk }) => ({
    symbol,
    name,
    themes,
    risk,
  })
);
