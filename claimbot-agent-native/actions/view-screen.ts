import { defineAction } from "@agent-native/core/action";
import { readAppState } from "@agent-native/core/application-state";
import { z } from "zod";
import { readAppStateForCurrentTab } from "@agent-native/core/application-state";
import { readOpportunity } from "../server/opportunities";

export default defineAction({
  description:
    "Read the Chat app's current navigation state. Basic navigation is already included in <current-screen>; use this action only when you need a fresh read.",
  schema: z.object({}),
  http: false,
  readOnly: true,
  run: async (_args, ctx) => {
    const navigation = await readAppState("navigation");

    const screen: Record<string, unknown> = {};
    if (navigation) screen.navigation = navigation;
    const url = await readAppStateForCurrentTab("__url__") as { search?: string } | null;
    const id = new URLSearchParams(url?.search ?? "").get("id");
    if (id) {
      const record = await readOpportunity(id, ctx);
      screen.opportunity = { id: record.id, title: record.title, revision: record.revision,
        analyzed: record.analysis !== null, checklistItems: record.checklist.length,
        sourceVerification: "user-supplied; not independently verified", nextAction: "get-opportunity" };
    }

    if (Object.keys(screen).length === 0) {
      return "No application state found. Is the app running?";
    }
    return screen;
  },
});
