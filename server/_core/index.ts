import "dotenv/config";
import express, { type Request, type Response } from "express";
import { createServer } from "http";
import https from "https";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { scheduleAutonomousLoop } from "../agent/autonomousLoop";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.get("/healthz", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      service: "basepulse",
      nodeEnv: process.env.NODE_ENV || "development",
      agentEnabled: process.env.BASEPULSE_AGENT_ENABLED === "true",
      timestamp: new Date().toISOString(),
    });
  });

  // ── Registry proxy: /api/registry/* → https://base.org/api/registry/* ──────
  app.use("/api/registry", (req: Request, res: Response) => {
    const upstreamPath = "/api/registry" + req.path + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    // Prefer client-supplied Authorization, fall back to server-side Base API key
    if (req.headers["authorization"]) {
      headers["authorization"] = req.headers["authorization"] as string;
    } else if (process.env.BASE_API_KEY) {
      headers["authorization"] = `Bearer ${process.env.BASE_API_KEY}`;
    }
    // Forward builder code if configured
    if (process.env.BASE_BUILDER_CODE) {
      headers["x-builder-code"] = process.env.BASE_BUILDER_CODE;
    }
    const options = {
      hostname: "base.org",
      port: 443,
      path: upstreamPath,
      method: req.method,
      headers,
    };
    const proxy = https.request(options, (upRes) => {
      res.writeHead(upRes.statusCode || 502, {
        "Content-Type": upRes.headers["content-type"] || "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      });
      upRes.pipe(res);
    });
    proxy.on("error", (err: Error) => {
      console.error("Registry proxy error:", err.message);
      res.status(502).json({ error: "Proxy error", detail: err.message });
    });
    req.pipe(proxy);
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  if (process.env.BASEPULSE_AGENT_ENABLED === "true") {
    // Start the autonomous agent loop only when explicitly enabled.
    // This prevents accidental token deployments when hosting the dashboard.
    scheduleAutonomousLoop({
      enabled: true,
      intervalMinutes: parseInt(process.env.BASEPULSE_AGENT_INTERVAL_MINUTES || "15"),
      minSentimentScore: parseInt(process.env.BASEPULSE_MIN_SENTIMENT_SCORE || "60"),
      minMentions: parseInt(process.env.BASEPULSE_MIN_MENTIONS || "5"),
      minVolume24hUSD: parseInt(process.env.BASEPULSE_MIN_VOLUME_24H_USD || "100000"),
      maxDeploymentsPerDay: parseInt(process.env.BASEPULSE_MAX_DEPLOYMENTS_PER_DAY || "10"),
    });
  } else {
    console.log("BasePulse autonomous agent loop is disabled. Set BASEPULSE_AGENT_ENABLED=true to enable it.");
  }
}

startServer().catch(console.error);
