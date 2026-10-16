export type Project = "BasePulse" | "ClaimBot";

export class RequestPreflightError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "RequestPreflightError";
  }
}

export function parseProject(project: unknown): Project {
  if (project === "BasePulse" || project === "ClaimBot") return project;
  throw new RequestPreflightError(400, "project must be BasePulse or ClaimBot");
}

export async function loadPaidOpportunities<T>(
  project: unknown,
  query: (target: Project) => Promise<T[]>,
): Promise<{project: Project; count: number; results: T[]}> {
  const target = parseProject(project);
  let results: T[];
  try {
    results = await query(target);
  } catch {
    throw new RequestPreflightError(503, "Verified opportunity data temporarily unavailable");
  }
  if (!Array.isArray(results)) {
    throw new RequestPreflightError(503, "Verified opportunity data temporarily unavailable");
  }
  if (results.length === 0) {
    throw new RequestPreflightError(404, "No eligible verified opportunities currently available");
  }
  return {project: target, count: results.length, results};
}
