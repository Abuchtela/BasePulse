import { defineActionErrors, type ActionRunContext } from "@agent-native/core/action";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "./db";
import { opportunities } from "./db/schema";
import { recordSchema } from "../shared/opportunity";

export const errors = defineActionErrors("unauthenticated", "not_found", "conflict", "unsupported_claim", "invalid_source");
export function scope(ctx?: ActionRunContext) {
  const owner = ctx?.userEmail;
  if (!owner) return errors.noWrite("Sign in before accessing opportunities.", "unauthenticated", { statusCode: 401 });
  return and(eq(opportunities.ownerEmail, owner),
    ctx?.orgId ? eq(opportunities.orgId, ctx.orgId) : isNull(opportunities.orgId));
}
export async function readOpportunity(id: string, ctx?: ActionRunContext) {
  const [row] = await getDb().select().from(opportunities).where(and(scope(ctx), eq(opportunities.id, id)));
  if (!row) errors.noWrite("Opportunity not found in your private workspace.", "not_found", { statusCode: 404 });
  return recordSchema.parse(row);
}
