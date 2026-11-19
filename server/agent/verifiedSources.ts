import { ENV } from "../_core/env";

const BASE_CHAIN_ID = 8453;
const MAX_SOCIAL_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_METRICS_AGE_MS = 15 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15_000;

export type VerifiedSocialPost = {
  text: string;
  sourceUrl: string;
  publishedAt: string;
};

export type VerifiedOnChainMetrics = {
  chainId: 8453;
  volume24h: number;
  volumeUSD24h: number;
  activeAddresses: number;
  transactionCount: number;
  observedAt: string;
  sourceUrl: string;
};

export function assertRecentSocialEvidence(posts: VerifiedSocialPost[]): void {
  if (posts.length === 0) {
    throw new Error("At least one supporting social post is required");
  }
  posts.forEach((post, index) => {
    requireRecentTimestamp(
      post.publishedAt,
      MAX_SOCIAL_AGE_MS,
      `supportingPosts[${index}].publishedAt`
    );
  });
}

function requireHttpsUrl(value: string, label: string): URL {
  if (!value) throw new Error(`${label} is not configured`);
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error(`${label} must use HTTPS`);
  return url;
}

function requireRecentTimestamp(
  value: unknown,
  maxAgeMs: number,
  label: string
): string {
  if (typeof value !== "string")
    throw new Error(`${label} must be an ISO timestamp`);
  const timestamp = Date.parse(value);
  const now = Date.now();
  if (!Number.isFinite(timestamp)) throw new Error(`${label} is invalid`);
  if (timestamp > now + 60_000) throw new Error(`${label} is in the future`);
  if (now - timestamp > maxAgeMs) throw new Error(`${label} is stale`);
  return new Date(timestamp).toISOString();
}

function requireNonNegativeNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite non-negative number`);
  }
  return value;
}

async function fetchJson(
  url: URL,
  bearerToken: string,
  label: string
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: bearerToken
        ? { authorization: `Bearer ${bearerToken}` }
        : undefined,
      // Do not allow a configured HTTPS evidence endpoint to redirect to HTTP.
      // Rejecting every redirect also keeps the authenticated request bound to
      // the explicitly configured origin.
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(`${label} returned HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export function assertVerifiedSourcesConfigured(): void {
  requireHttpsUrl(ENV.socialFeedUrl, "BASEPULSE_SOCIAL_FEED_URL");
  requireHttpsUrl(ENV.onchainMetricsUrl, "BASEPULSE_ONCHAIN_METRICS_URL");
}

export async function fetchVerifiedSocialPosts(): Promise<
  VerifiedSocialPost[]
> {
  const endpoint = requireHttpsUrl(
    ENV.socialFeedUrl,
    "BASEPULSE_SOCIAL_FEED_URL"
  );
  const payload = await fetchJson(
    endpoint,
    ENV.socialFeedBearerToken,
    "Social feed"
  );
  const records = (payload as { posts?: unknown })?.posts;
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error("Social feed returned no posts; refusing to invent input");
  }

  const seenSourceUrls = new Set<string>();
  return records.map((record, index) => {
    if (!record || typeof record !== "object")
      throw new Error(`posts[${index}] is invalid`);
    const value = record as Record<string, unknown>;
    if (typeof value.text !== "string" || !value.text.trim()) {
      throw new Error(`posts[${index}].text is empty`);
    }
    const sourceUrl = requireHttpsUrl(
      String(value.sourceUrl ?? ""),
      `posts[${index}].sourceUrl`
    );
    const normalizedSourceUrl = sourceUrl.toString();
    if (seenSourceUrls.has(normalizedSourceUrl)) {
      throw new Error(
        `posts[${index}].sourceUrl duplicates an earlier source record`
      );
    }
    seenSourceUrls.add(normalizedSourceUrl);
    return {
      text: value.text.trim(),
      sourceUrl: normalizedSourceUrl,
      publishedAt: requireRecentTimestamp(
        value.publishedAt,
        MAX_SOCIAL_AGE_MS,
        `posts[${index}].publishedAt`
      ),
    };
  });
}

export async function fetchVerifiedOnChainMetrics(): Promise<VerifiedOnChainMetrics> {
  const endpoint = requireHttpsUrl(
    ENV.onchainMetricsUrl,
    "BASEPULSE_ONCHAIN_METRICS_URL"
  );
  const payload = await fetchJson(
    endpoint,
    ENV.onchainMetricsBearerToken,
    "Onchain metrics source"
  );
  if (!payload || typeof payload !== "object")
    throw new Error("Onchain metrics payload is invalid");
  const value = payload as Record<string, unknown>;
  if (value.chainId !== BASE_CHAIN_ID) {
    throw new Error(
      `Onchain metrics must be for Base mainnet chain ${BASE_CHAIN_ID}`
    );
  }

  return {
    chainId: BASE_CHAIN_ID,
    volume24h: requireNonNegativeNumber(value.volume24h, "volume24h"),
    volumeUSD24h: requireNonNegativeNumber(value.volumeUSD24h, "volumeUSD24h"),
    activeAddresses: requireNonNegativeNumber(
      value.activeAddresses,
      "activeAddresses"
    ),
    transactionCount: requireNonNegativeNumber(
      value.transactionCount,
      "transactionCount"
    ),
    observedAt: requireRecentTimestamp(
      value.observedAt,
      MAX_METRICS_AGE_MS,
      "observedAt"
    ),
    sourceUrl: requireHttpsUrl(
      String(value.sourceUrl ?? ""),
      "sourceUrl"
    ).toString(),
  };
}
