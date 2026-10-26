export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // Base Developer Platform
  baseApiKey: process.env.BASE_API_KEY ?? "",
  baseBuilderCode: process.env.BASE_BUILDER_CODE ?? "",
  // Verified external inputs for the autonomous loop. The loop fails closed
  // when either source is absent, stale, malformed, or non-HTTPS.
  socialFeedUrl: process.env.BASEPULSE_SOCIAL_FEED_URL ?? "",
  socialFeedBearerToken: process.env.BASEPULSE_SOCIAL_FEED_BEARER_TOKEN ?? "",
  onchainMetricsUrl: process.env.BASEPULSE_ONCHAIN_METRICS_URL ?? "",
  onchainMetricsBearerToken:
    process.env.BASEPULSE_ONCHAIN_METRICS_BEARER_TOKEN ?? "",
};
