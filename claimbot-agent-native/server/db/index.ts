import { createGetDb } from "@agent-native/core/db";
import * as schema from "./schema";
export const getDb = createGetDb(schema);
