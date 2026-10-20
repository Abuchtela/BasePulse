import { readFileSync, writeFileSync } from "node:fs";
const source = readFileSync(new URL("../public/publisher.js",import.meta.url),"utf8");
if (source.length < 1000) throw new Error("Browser publisher bundle is unexpectedly small");
writeFileSync(new URL("../src/publisherBundle.ts",import.meta.url),"export const PUBLISHER_JS = " + JSON.stringify(source) + ";");
console.log("Embedded browser wallet bundle",source.length,"bytes");
