import { readFileSync, writeFileSync } from "node:fs";
import { build } from "esbuild";

const root = new URL("../", import.meta.url);
const result = await build({entryPoints:[new URL("web/buyer.ts",root).pathname], bundle:true, platform:"browser",format:"esm",target:"es2022",minify:true,write:false});
const buyerJs = result.outputFiles[0].text;
const checkoutHtml = readFileSync(new URL("public/index.html",root),"utf8");
const publisherHtml = readFileSync(new URL("public/publish.html",root),"utf8");
const draft = JSON.parse(readFileSync(new URL("data/verified-opportunity.json",root),"utf8"));
writeFileSync(new URL("src/checkoutBundle.ts",root),[
  `export const BUYER_JS = ${JSON.stringify(buyerJs)};`,
  `export const CHECKOUT_HTML = ${JSON.stringify(checkoutHtml)};`,
  `export const PUBLISHER_HTML = ${JSON.stringify(publisherHtml)};`,
  `export const PUBLISHER_DRAFT = ${JSON.stringify(draft)};`,
].join("\n")+"\n");
console.log("Built checkout and publisher pages", buyerJs.length, "JS bytes");
