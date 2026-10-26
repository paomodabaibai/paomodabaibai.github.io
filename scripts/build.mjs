import { cpSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dest = resolve(root, "dist");
mkdirSync(dest, { recursive: true });
for (const name of ["index.html", "src", "public"])
  cpSync(resolve(root, name), resolve(dest, name), { recursive: true });
console.log("Static site built to " + dest);
