import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { toFunctionSelector } from "viem";

const outDir = "/tmp/basepulse-arc-solc";
const files = await readdir(outDir);
const abiName = files.find((name) => name.endsWith("_ArcTreasuryProof.abi"));
const binName = files.find((name) => name.endsWith("_ArcTreasuryProof.bin"));
if (!abiName || !binName) throw new Error("Expected compiled ArcTreasuryProof ABI and bytecode");
const abi = JSON.parse(await readFile(join(outDir, abiName), "utf8"));
const bytecode = "0x" + (await readFile(join(outDir, binName), "utf8")).trim();
if (!/^0x[0-9a-f]+$/i.test(bytecode) || bytecode.length < 200) {
  throw new Error("Missing or invalid contract deployment bytecode");
}
if (!abi.some((item) => item.type === "function" && item.name === "recordProof")) {
  throw new Error("Contract recordProof entry missing");
}
const artifact = {
  contractName: "ArcTreasuryProof",
  compiler: "solc 0.8.28",
  chainId: 5042,
  abi,
  bytecode,
  recordProofSelector: toFunctionSelector("recordProof(bytes32)"),
};
const destination = "docs/arc-demo/ArcTreasuryProof.json";
await writeFile(destination, JSON.stringify(artifact, null, 2) + "\n");
console.log("Compiled ArcTreasuryProof with deployment bytecode length", (bytecode.length - 2) / 2);
console.log("Published artifact:", destination);
