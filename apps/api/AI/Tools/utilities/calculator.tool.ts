import { tool } from "@langchain/core/tools";
import { z } from "zod";

type Token =
  | { type: "number"; value: number }
  | { type: "identifier"; value: string }
  | { type: "operator"; value: string }
  | { type: "lparen" }
  | { type: "rparen" }
  | { type: "comma" };

const MAX_EXPRESSION_LENGTH = 1000;
const MAX_TOKENS = 300;

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
  tau: Math.PI * 2,
};

const FUNCTIONS: Record<string, (...args: number[]) => number> = {
  sqrt: (x) => {
    if (x! < 0) throw new Error("sqrt() requires a non-negative number.");
    return Math.sqrt(x!);
  },
  cbrt: (x) => Math.cbrt(x!),
  abs: (x) => Math.abs(x!),
  floor: (x) => Math.floor(x!),
  ceil: (x) => Math.ceil(x!),
  round: (x) => Math.round(x!),
  trunc: (x) => Math.trunc(x!),
  sin: (x) => Math.sin(x!),
  cos: (x) => Math.cos(x!),
  tan: (x) => Math.tan(x!),
  asin: (x) => {
    if (x! < -1 || x! > 1) throw new Error("asin() requires input in [-1, 1].");
    return Math.asin(x!);
  },
  acos: (x) => {
    if (x! < -1 || x! > 1) throw new Error("acos() requires input in [-1, 1].");
    return Math.acos(x!);
  },
  atan: (x) => Math.atan(x!),
  atan2: (y, x) => Math.atan2(y!, x!),
  sinh: (x) => Math.sinh(x!),
  cosh: (x) => Math.cosh(x!),
  tanh: (x) => Math.tanh(x!),
  exp: (x) => Math.exp(x!),
  ln: (x) => {
    if (x! <= 0) throw new Error("ln() requires a positive number.");
    return Math.log(x!);
  },
  log: (x, base) => {
    if (x! <= 0) throw new Error("log() requires a positive number.");
    if (base === undefined) return Math.log10(x!);
    if (base! <= 0 || base! === 1)
      throw new Error("log() base must be positive and not equal to 1.");
    return Math.log(x!) / Math.log(base!);
  },
  log2: (x) => {
    if (x! <= 0) throw new Error("log2() requires a positive number.");
    return Math.log2(x!);
  },
  log10: (x) => {
    if (x! <= 0) throw new Error("log10() requires a positive number.");
    return Math.log10(x!);
  },
  pow: (base, exp) => Math.pow(base!, exp!),
  max: (...args) => {
    if (args.length === 0) throw new Error("max() requires at least one argument.");
    return Math.max(...args);
  },
  min: (...args) => {
    if (args.length === 0) throw new Error("min() requires at least one argument.");
    return Math.min(...args);
  },
  hypot: (...args) => {
    if (args.length === 0) throw new Error("hypot() requires at least one argument.");
    return Math.hypot(...args);
  },
};

const SINGLE_ARG_FUNCTIONS = new Set([
  "sqrt",
  "cbrt",
  "abs",
  "floor",
  "ceil",
  "round",
  "trunc",
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "sinh",
  "cosh",
  "tanh",
  "exp",
  "ln",
  "log2",
  "log10",
]);

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i]!;

    if (/\s/.test(char)) {
      i += 1;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      if (
        char === "." &&
        (i + 1 >= input.length || !/[0-9]/.test(input[i + 1]!))
      ) {
        throw new Error(`Unsupported character: "${char}".`);
      }
      let num = "";
      let dots = 0;
      while (i < input.length && /[0-9.]/.test(input[i]!)) {
        if (input[i] === ".") dots += 1;
        if (dots > 1) throw new Error("Invalid number: multiple decimal points.");
        num += input[i];
        i += 1;
      }
      // Scientific notation: 1e10, 1.5E-3
      if (i < input.length && (input[i] === "e" || input[i] === "E")) {
        let exp = input[i]!;
        i += 1;
        if (i < input.length && (input[i] === "+" || input[i] === "-")) {
          exp += input[i];
          i += 1;
        }
        let digits = "";
        while (i < input.length && /[0-9]/.test(input[i]!)) {
          digits += input[i];
          i += 1;
        }
        if (digits.length === 0) throw new Error(`Invalid number: "${num}${exp}".`);
        num += exp + digits;
      }
      const value = Number(num);
      if (!Number.isFinite(value) || num === "." || num === "")
        throw new Error(`Invalid number: "${num}".`);
      tokens.push({ type: "number", value });
      continue;
    }

    if (/[a-zA-Z_]/.test(char)) {
      let name = "";
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i]!)) {
        name += input[i];
        i += 1;
      }
      tokens.push({ type: "identifier", value: name.toLowerCase() });
      continue;
    }

    if (char === "*" && input[i + 1] === "*") {
      tokens.push({ type: "operator", value: "^" });
      i += 2;
      continue;
    }

    if ("+-*/%^!".includes(char)) {
      tokens.push({ type: "operator", value: char });
      i += 1;
      continue;
    }

    if (char === "(") {
      tokens.push({ type: "lparen" });
      i += 1;
      continue;
    }

    if (char === ")") {
      tokens.push({ type: "rparen" });
      i += 1;
      continue;
    }

    if (char === ",") {
      tokens.push({ type: "comma" });
      i += 1;
      continue;
    }

    throw new Error(`Unsupported character: "${char}".`);
  }

  if (tokens.length === 0) throw new Error("Expression is empty.");
  if (tokens.length > MAX_TOKENS)
    throw new Error(`Expression is too complex (max ${MAX_TOKENS} tokens).`);

  return tokens;
}

function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0)
    throw new Error("Factorial (!) requires a non-negative integer.");
  if (n > 170) throw new Error("Factorial (!) result overflows (max 170!).");
  let result = 1;
  for (let k = 2; k <= n; k += 1) result *= k;
  return result;
}

class Parser {
  private pos = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): number {
    const value = this.parseExpression();
    if (this.pos < this.tokens.length)
      throw new Error("Unexpected trailing characters in expression.");
    return value;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private next(): Token | undefined {
    return this.tokens[this.pos++];
  }

  // expression := term (("+" | "-") term)*
  private parseExpression(): number {
    let value = this.parseTerm();
    for (;;) {
      const token = this.peek();
      if (token?.type === "operator" && (token.value === "+" || token.value === "-")) {
        this.next();
        const rhs = this.parseTerm();
        value = token.value === "+" ? value + rhs : value - rhs;
      } else {
        return value;
      }
    }
  }

  // term := factor (("*" | "/" | "%") factor)*
  private parseTerm(): number {
    let value = this.parseFactor();
    for (;;) {
      const token = this.peek();
      if (
        token?.type === "operator" &&
        (token.value === "*" || token.value === "/" || token.value === "%")
      ) {
        this.next();
        const rhs = this.parseFactor();
        if (token.value === "*") {
          value *= rhs;
        } else if (token.value === "/") {
          if (rhs === 0) throw new Error("Division by zero.");
          value /= rhs;
        } else {
          if (rhs === 0) throw new Error("Modulo by zero.");
          value %= rhs;
        }
      } else {
        return value;
      }
    }
  }

  // factor := unary ("^" factor)?  (right-associative)
  private parseFactor(): number {
    const base = this.parseUnary();
    const token = this.peek();
    if (token?.type === "operator" && token.value === "^") {
      this.next();
      const exponent = this.parseFactor();
      const result = Math.pow(base, exponent);
      if (!Number.isFinite(result))
        throw new Error("Result is not finite (overflow or undefined).");
      return result;
    }
    return base;
  }

  // unary := ("+" | "-") unary | postfix
  private parseUnary(): number {
    const token = this.peek();
    if (token?.type === "operator" && (token.value === "+" || token.value === "-")) {
      this.next();
      const value = this.parseUnary();
      return token.value === "+" ? value : -value;
    }
    return this.parsePostfix();
  }

  // postfix := primary ("!")*
  private parsePostfix(): number {
    let value = this.parsePrimary();
    for (;;) {
      const token = this.peek();
      if (token?.type === "operator" && token.value === "!") {
        this.next();
        value = factorial(value);
      } else {
        return value;
      }
    }
  }

  private parsePrimary(): number {
    const token = this.next();
    if (!token) throw new Error("Unexpected end of expression.");

    if (token.type === "number") return token.value;

    if (token.type === "lparen") {
      const value = this.parseExpression();
      const closing = this.next();
      if (!closing || closing.type !== "rparen")
        throw new Error("Mismatched parentheses: missing closing ')'.");
      return value;
    }

    if (token.type === "identifier") {
      const name = token.value;
      const next = this.peek();

      if (next?.type === "lparen") {
        this.next(); // consume "("
        const args = this.parseArguments();
        if (!Object.hasOwn(FUNCTIONS, name)) throw new Error(`Unknown function: "${name}".`);
        const fn = FUNCTIONS[name]!;
        if (SINGLE_ARG_FUNCTIONS.has(name) && args.length !== 1)
          throw new Error(`Function "${name}" expects 1 argument, got ${args.length}.`);
        return fn(...args);
      }

      if (Object.hasOwn(CONSTANTS, name)) return CONSTANTS[name]!;
      throw new Error(`Unknown identifier: "${name}".`);
    }

    throw new Error("Unexpected token in expression.");
  }

  private parseArguments(): number[] {
    const args: number[] = [];
    const first = this.peek();
    if (first?.type === "rparen") {
      this.next();
      return args;
    }
    for (;;) {
      args.push(this.parseExpression());
      const token = this.next();
      if (!token) throw new Error("Mismatched parentheses: missing closing ')'.");
      if (token.type === "rparen") return args;
      if (token.type !== "comma")
        throw new Error("Expected ',' between function arguments.");
      if (args.length > 32) throw new Error("Too many function arguments (max 32).");
    }
  }
}

function cleanResult(value: number): number {
  if (typeof value !== "number" || Number.isNaN(value))
    throw new Error("Result is not a number.");
  if (!Number.isFinite(value))
    throw new Error("Result is not finite (overflow or undefined).");
  // Tame binary floating-point artifacts (e.g. 0.1 + 0.2).
  return Number.parseFloat(value.toPrecision(12));
}

export function evaluateExpression(expression: string): number {
  const normalized = expression
    .trim()
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-");

  if (normalized.length === 0) throw new Error("Expression must not be empty.");
  if (normalized.length > MAX_EXPRESSION_LENGTH)
    throw new Error(`Expression exceeds ${MAX_EXPRESSION_LENGTH} characters.`);

  const tokens = tokenize(normalized);
  const result = new Parser(tokens).parse();
  return cleanResult(result);
}

export const calculatorTool = tool(
  async ({ expression }) => {
    const result = evaluateExpression(expression);

    return JSON.stringify({
      expression: expression.trim(),
      result,
    });
  },
  {
    name: "calculator",
    description:
      "Evaluate a mathematical expression and return the numeric result. " +
      "Supports +, -, *, /, %, ^ (or **) for exponentiation, parentheses, " +
      "factorial (!), constants pi/e/tau, and functions: " +
      "sqrt, cbrt, abs, floor, ceil, round, trunc, sin, cos, tan, asin, acos, " +
      "atan, atan2, sinh, cosh, tanh, exp, ln, log, log2, log10, pow, max, min, hypot. " +
      "Trigonometric functions use radians. Percent (%) is modulo, not percentage.",
    schema: z.object({
      expression: z
        .string()
        .trim()
        .min(1)
        .max(MAX_EXPRESSION_LENGTH)
        .describe("The mathematical expression to evaluate, e.g. '(2 + 3) * 4^2'"),
    }),
  },
);
