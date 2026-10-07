import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Orval's generated schemas evaluate min/max constants immediately on import.
// Keep literal bound declarations ahead of every schema, irrespective of
// operation ordering. Never patch the generated file as a one-off fix.
const path = fileURLToPath(new URL("../../api-zod/src/generated/api.ts", import.meta.url));
const source = readFileSync(path, "utf8");
const literal = /^export const [a-z]\w* = -?\d+(?:\.\d+)?;[ \t]*$/gm;
const bounds = [...source.matchAll(literal)].map(match => match[0]);
if (bounds.length === 0) throw new Error("Generated Zod bounds not found; check generator output.");
const rest = source.replace(literal, "");
const importStatement = /import \* as zod from ['"]zod['"];/;
if (!importStatement.test(rest)) throw new Error("Generated Zod import not found.");
writeFileSync(path, rest.replace(importStatement, match => `${match}\n\n${bounds.join("\n")}`));
