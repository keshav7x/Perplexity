import { tool } from "@langchain/core/tools";
import { z } from "zod";

const MAX_JSON_LENGTH = 100_000;
const MAX_DEPTH = 50;
const MAX_ENTRIES = 5_000;
const MAX_CSV_ROWS = 5_000;
const MAX_CSV_COLUMNS = 100;

const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype"]);

type PathToken = { type: "key"; name: string } | { type: "index"; index: number };

export function parseJsonSafe(text: string, fieldName = "json"): unknown {
  const raw = (text ?? "").trim();
  if (raw.length === 0) throw new Error(`"${fieldName}" must not be empty.`);
  if (raw.length > MAX_JSON_LENGTH)
    throw new Error(`"${fieldName}" exceeds ${MAX_JSON_LENGTH} characters.`);
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in "${fieldName}": ${(err as Error).message}`);
  }
}

export function checkJsonSize(value: unknown): void {
  // Iterative walk: counts nodes and tracks depth to bound output.
  let count = 0;
  const stack: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
  while (stack.length > 0) {
    const node = stack.pop()!;
    count += 1;
    if (count > MAX_ENTRIES)
      throw new Error(`JSON is too large (max ${MAX_ENTRIES} values).`);
    if (node.depth > MAX_DEPTH)
      throw new Error(`JSON is nested too deeply (max depth ${MAX_DEPTH}).`);
    if (Array.isArray(node.value)) {
      for (let i = node.value.length - 1; i >= 0; i -= 1)
        stack.push({ value: node.value[i], depth: node.depth + 1 });
    } else if (typeof node.value === "object" && node.value !== null) {
      for (const key of Object.keys(node.value))
        stack.push({
          value: (node.value as Record<string, unknown>)[key],
          depth: node.depth + 1,
        });
    }
  }
}

function assertSafeKey(name: string, path: string): void {
  if (BLOCKED_KEYS.has(name))
    throw new Error(`Blocked key in path "${path}": "${name}".`);
}

export function parseJsonPath(path: string): PathToken[] {
  const raw = (path ?? "").trim();
  if (raw.length === 0) throw new Error('"path" must not be empty.');
  if (raw.length > 1_000) throw new Error('"path" exceeds 1000 characters.');
  if (raw === "$") return [];

  const tokens: PathToken[] = [];
  let i = 0;
  const n = raw.length;
  const expectSegmentStart = (): boolean => tokens.length === 0 || raw[i - 1] === "." || raw[i - 1] === "]";

  while (i < n) {
    const char = raw[i]!;
    if (char === ".") {
      if (tokens.length === 0 || raw[i - 1] === ".")
        throw new Error(`Invalid path "${path}": empty segment.`);
      i += 1;
      if (i >= n) throw new Error(`Invalid path "${path}": trailing dot.`);
      continue;
    }
    if (char === "[") {
      const close = raw.indexOf("]", i);
      if (close === -1) throw new Error(`Invalid path "${path}": missing "]".`);
      const inner = raw.slice(i + 1, close).trim();
      if (/^\d+$/.test(inner)) {
        tokens.push({ type: "index", index: Number(inner) });
      } else if (
        (inner.startsWith('"') && inner.endsWith('"')) ||
        (inner.startsWith("'") && inner.endsWith("'"))
      ) {
        const name = inner.slice(1, -1);
        if (name.length === 0) throw new Error(`Invalid path "${path}": empty key.`);
        assertSafeKey(name, path);
        tokens.push({ type: "key", name });
      } else {
        throw new Error(
          `Invalid path "${path}": bracket must hold an index or quoted key.`,
        );
      }
      i = close + 1;
      continue;
    }
    if (char === "]") throw new Error(`Invalid path "${path}": unexpected "]".`);
    // Bare key: read until next "." or "[".
    let j = i;
    while (j < n && raw[j] !== "." && raw[j] !== "[") j += 1;
    const name = raw.slice(i, j).trim();
    if (name.length === 0) throw new Error(`Invalid path "${path}": empty segment.`);
    if (!expectSegmentStart() && tokens.length > 0 && raw[i - 1] !== "." && raw[i - 1] !== "]")
      throw new Error(`Invalid path "${path}".`);
    assertSafeKey(name, path);
    tokens.push({ type: "key", name });
    i = j;
  }
  if (tokens.length === 0) throw new Error(`Invalid path "${path}".`);
  return tokens;
}

export function getPathValue(root: unknown, path: string): unknown {
  const tokens = parseJsonPath(path);
  let current: unknown = root;
  for (const token of tokens) {
    if (token.type === "index") {
      if (!Array.isArray(current))
        throw new Error(`Path "${path}" not found: not an array at [${token.index}].`);
      if (token.index >= current.length)
        throw new Error(`Path "${path}" not found: index ${token.index} out of bounds.`);
      current = current[token.index];
    } else {
      if (typeof current !== "object" || current === null || Array.isArray(current))
        throw new Error(`Path "${path}" not found: "${token.name}" is not an object key here.`);
      if (!Object.hasOwn(current, token.name))
        throw new Error(`Path "${path}" not found: missing key "${token.name}".`);
      current = (current as Record<string, unknown>)[token.name];
    }
  }
  return current;
}

export function pickKeys(
  root: unknown,
  keys: string[],
): { result: Record<string, unknown>; missing: string[] } {
  if (typeof root !== "object" || root === null || Array.isArray(root))
    throw new Error('"pick" requires a JSON object at the top level.');
  const result: Record<string, unknown> = {};
  const missing: string[] = [];
  for (const key of keys) {
    if (Object.hasOwn(root, key)) result[key] = (root as Record<string, unknown>)[key];
    else missing.push(key);
  }
  return { result, missing };
}

export function flattenObject(value: unknown, separator: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const stack: Array<{ value: unknown; path: string }> = [{ value, path: "" }];
  while (stack.length > 0) {
    const node = stack.pop()!;
    if (Array.isArray(node.value)) {
      if (node.value.length === 0) {
        out[node.path] = [];
      } else {
        for (let i = node.value.length - 1; i >= 0; i -= 1) {
          const p = node.path === "" ? String(i) : `${node.path}${separator}${i}`;
          stack.push({ value: node.value[i], path: p });
        }
      }
    } else if (typeof node.value === "object" && node.value !== null) {
      const keys = Object.keys(node.value);
      if (keys.length === 0) {
        if (node.path !== "") out[node.path] = {};
      } else {
        for (let k = keys.length - 1; k >= 0; k -= 1) {
          const key = keys[k]!;
          const p = node.path === "" ? key : `${node.path}${separator}${key}`;
          stack.push({
            value: (node.value as Record<string, unknown>)[key],
            path: p,
          });
        }
      }
    } else {
      out[node.path] = node.value;
    }
    if (Object.keys(out).length > MAX_ENTRIES)
      throw new Error(`Flattened JSON exceeds ${MAX_ENTRIES} entries.`);
  }
  // Top-level primitive: represent under "" is awkward; return as-is shape.
  if ("" in out && Object.keys(out).length === 1) return { value: out[""] } as Record<string, unknown>;
  return out;
}

export function unflattenObject(
  flat: Record<string, unknown>,
  separator: string,
): unknown {
  let sawNested = false;
  let root: Record<string, unknown> | unknown[] = {};
  for (const [flatKey, val] of Object.entries(flat)) {
    if (flatKey === "") throw new Error("Cannot unflatten an empty key.");
    const segments = flatKey.split(separator);
    if (segments.some((s) => s.length === 0))
      throw new Error(`Cannot unflatten key "${flatKey}": empty segment.`);
    for (const s of segments) assertSafeKey(s, flatKey);
    sawNested = sawNested || segments.length > 1;
    let current: Record<string, unknown> | unknown[] = root;
    for (let i = 0; i < segments.length; i += 1) {
      const seg = segments[i]!;
      const isLast = i === segments.length - 1;
      const nextSeg = segments[i + 1];
      const nextIsIndex = nextSeg !== undefined && /^\d+$/.test(nextSeg);
      if (Array.isArray(current)) {
        if (!/^\d+$/.test(seg))
          throw new Error(`Cannot unflatten key "${flatKey}": "${seg}" is not an array index.`);
        const idx = Number(seg);
        if (isLast) {
          if (idx < current.length && current[idx] !== undefined)
            throw new Error(`Conflicting values at "${flatKey}".`);
          current[idx] = val;
        } else {
          if (current[idx] === undefined) current[idx] = nextIsIndex ? [] : {};
          const child = current[idx];
          if (typeof child !== "object" || child === null)
            throw new Error(`Conflicting values at "${flatKey}".`);
          current = child as Record<string, unknown> | unknown[];
        }
      } else {
        if (isLast) {
          if (Object.hasOwn(current, seg))
            throw new Error(`Conflicting values at "${flatKey}".`);
          current[seg] = val;
        } else {
          if (current[seg] === undefined) current[seg] = nextIsIndex ? [] : {};
          const child = current[seg];
          if (typeof child !== "object" || child === null)
            throw new Error(`Conflicting values at "${flatKey}".`);
          current = child as Record<string, unknown> | unknown[];
        }
      }
    }
  }
  if (!sawNested) return flat;
  return root;
}

function csvCell(value: string, delimiter: string): string {
  if (
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function scalarToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value) ?? "";
}

export function jsonToCsv(rows: unknown[], delimiter: string): string {
  if (rows.length === 0) throw new Error('"to_csv" requires a non-empty array.');
  if (rows.length > MAX_CSV_ROWS)
    throw new Error(`"to_csv" supports at most ${MAX_CSV_ROWS} rows.`);
  const columns: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (typeof row !== "object" || row === null || Array.isArray(row))
      throw new Error('"to_csv" requires an array of objects.');
    for (const key of Object.keys(row as Record<string, unknown>)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
      if (columns.length > MAX_CSV_COLUMNS)
        throw new Error(`"to_csv" supports at most ${MAX_CSV_COLUMNS} columns.`);
    }
  }
  if (columns.length === 0) throw new Error('"to_csv" found no columns.');
  const lines = [columns.map((c) => csvCell(c, delimiter)).join(delimiter)];
  for (const row of rows) {
    const record = row as Record<string, unknown>;
    lines.push(
      columns.map((c) => csvCell(scalarToString(record[c]), delimiter)).join(delimiter),
    );
  }
  return lines.join("\n");
}

function valueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

const schema = z.object({
  operation: z
    .enum([
      "parse",
      "prettify",
      "minify",
      "query",
      "pick",
      "flatten",
      "unflatten",
      "to_csv",
    ])
    .default("parse")
    .describe(
      "parse: validate and summarize. prettify/minify: reformat. query: extract a value at a path. " +
        "pick: keep selected top-level keys. flatten/unflatten: convert between nested and flat forms. " +
        "to_csv: convert an array of objects to CSV.",
    ),
  json: z
    .string()
    .trim()
    .min(1)
    .max(MAX_JSON_LENGTH)
    .describe("The JSON document to transform."),
  path: z
    .string()
    .trim()
    .min(1)
    .max(1000)
    .optional()
    .describe('Dot/bracket path for query, e.g. "users[0].name". Only used by query.'),
  keys: z
    .array(z.string().trim().min(1).max(200))
    .min(1)
    .max(100)
    .optional()
    .describe("Top-level keys to keep. Only used by pick."),
  indent: z
    .number()
    .int()
    .min(0)
    .max(8)
    .default(2)
    .describe("Indentation spaces for prettify. Only used by prettify."),
  separator: z
    .string()
    .min(1)
    .max(5)
    .default(".")
    .describe("Separator joining nested keys for flatten/unflatten."),
  delimiter: z
    .string()
    .min(1)
    .max(1)
    .default(",")
    .describe("Column delimiter for to_csv (single character)."),
});

export const jsonTransformerTool = tool(
  async (input) => {
    const { operation } = input;
    const parsed = parseJsonSafe(input.json);
    checkJsonSize(parsed);

    switch (operation) {
      case "parse": {
        const summary =
          Array.isArray(parsed)
            ? { type: "array", length: parsed.length }
            : typeof parsed === "object" && parsed !== null
              ? { type: "object", keys: Object.keys(parsed) }
              : { type: valueType(parsed) };
        return JSON.stringify({ operation, valid: true, summary, value: parsed });
      }

      case "prettify": {
        return JSON.stringify({
          operation,
          output: JSON.stringify(parsed, null, input.indent),
        });
      }

      case "minify": {
        return JSON.stringify({ operation, output: JSON.stringify(parsed) });
      }

      case "query": {
        if (!input.path) throw new Error('"path" is required for query.');
        const value = getPathValue(parsed, input.path);
        checkJsonSize(value);
        return JSON.stringify({ operation, path: input.path, value });
      }

      case "pick": {
        if (!input.keys) throw new Error('"keys" is required for pick.');
        const { result, missing } = pickKeys(parsed, input.keys);
        return JSON.stringify({
          operation,
          keys: input.keys,
          missing,
          value: result,
        });
      }

      case "flatten": {
        const flat = flattenObject(parsed, input.separator);
        return JSON.stringify({ operation, separator: input.separator, value: flat });
      }

      case "unflatten": {
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
          throw new Error('"unflatten" requires a flat JSON object.');
        const flat = parsed as Record<string, unknown>;
        for (const [k, v] of Object.entries(flat)) {
          if (typeof v === "object" && v !== null)
            throw new Error(
              `Cannot unflatten key "${k}": values must be primitives (got nested value).`,
            );
        }
        return JSON.stringify({
          operation,
          separator: input.separator,
          value: unflattenObject(flat, input.separator),
        });
      }

      case "to_csv": {
        if (!Array.isArray(parsed))
          throw new Error('"to_csv" requires a top-level JSON array of objects.');
        return JSON.stringify({
          operation,
          delimiter: input.delimiter,
          output: jsonToCsv(parsed, input.delimiter),
        });
      }
    }
  },
  {
    name: "json_transformer",
    description:
      "Parse, validate, reformat, and reshape JSON without executing code. " +
      'Operations: parse (validate + summarize), prettify, minify, query (dot/bracket path like "users[0].name"), ' +
      "pick (keep top-level keys), flatten/unflatten (nested <-> dot-keyed object), " +
      "to_csv (array of objects to CSV). Never executes JavaScript.",
    schema,
  },
);
