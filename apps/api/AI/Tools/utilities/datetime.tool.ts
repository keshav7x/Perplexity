import { tool } from "@langchain/core/tools";
import { z } from "zod";

const TimeUnit = z
  .enum([
    "millisecond",
    "second",
    "minute",
    "hour",
    "day",
    "week",
    "month",
    "quarter",
    "year",
  ])
  .describe(
    "Time unit for add/diff operations: millisecond, second, minute, hour, day, week, month, quarter, or year.",
  );

type TimeUnitValue = z.infer<typeof TimeUnit>;

const UNIT_MS: Record<Exclude<TimeUnitValue, "month" | "quarter" | "year">, number> = {
  millisecond: 1,
  second: 1_000,
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
};

function isCalendarUnit(unit: TimeUnitValue): unit is "month" | "quarter" | "year" {
  return unit === "month" || unit === "quarter" || unit === "year";
}

export function resolveTimeZone(timezone: string | undefined): string {
  const tz = (timezone ?? "UTC").trim() || "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date(0));
  } catch {
    throw new Error(
      `Unknown timezone: "${tz}". Use an IANA timezone name, e.g. "UTC", "America/New_York", "Asia/Kolkata".`,
    );
  }
  return tz;
}

export function parseDateInput(value: string | undefined, fieldName: string): Date {
  const raw = (value ?? "").trim();
  if (raw === "" || raw.toLowerCase() === "now") return new Date();
  // Bare unix timestamps: 10 digits = seconds, 13 digits = milliseconds.
  if (/^\d{10}$/.test(raw)) return new Date(Number(raw) * 1_000);
  if (/^\d{13}$/.test(raw)) return new Date(Number(raw));
  const date = new Date(raw);
  if (Number.isNaN(date.getTime()))
    throw new Error(
      `Invalid date for "${fieldName}": "${value}". Use ISO 8601 (e.g. "2026-10-16T12:00:00Z"), "now", or a unix timestamp.`,
    );
  return date;
}

function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(date).map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    Number(parts["year"]),
    Number(parts["month"]) - 1,
    Number(parts["day"]),
    Number(parts["hour"]),
    Number(parts["minute"]),
    Number(parts["second"]),
  );
  return Math.round((asUtc - date.getTime()) / 60_000);
}

function formatOffset(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? "-" : "+";
  const abs = Math.abs(totalMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${sign}${hh}:${mm}`;
}

export function describeDate(date: Date, timeZone: string) {
  const tz = resolveTimeZone(timeZone);
  const offsetMinutes = getTimeZoneOffsetMinutes(date, tz);
  const localeString = date.toLocaleString("en-US", {
    timeZone: tz,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "long",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );

  return {
    iso: date.toISOString(),
    unixMs: date.getTime(),
    unixSec: Math.floor(date.getTime() / 1_000),
    utc: date.toUTCString(),
    timezone: tz,
    timezoneOffset: formatOffset(offsetMinutes),
    localeString,
    year: Number(parts["year"]),
    month: Number(parts["month"]),
    day: Number(parts["day"]),
    weekday: parts["weekday"] ?? null,
    hour24: Number(parts["hour"]),
    minute: Number(parts["minute"]),
    second: Number(parts["second"]),
  };
}

export function addToDate(date: Date, amount: number, unit: TimeUnitValue): Date {
  if (!Number.isFinite(amount) || !Number.isInteger(amount))
    throw new Error(`"amount" must be an integer, got: ${amount}.`);
  if (Math.abs(amount) > 1_000_000)
    throw new Error(`"amount" is out of range (max absolute value 1000000).`);

  const result = new Date(date.getTime());
  switch (unit) {
    case "millisecond":
    case "second":
    case "minute":
    case "hour":
    case "day":
    case "week":
      return new Date(result.getTime() + amount * UNIT_MS[unit]);
    case "month":
      result.setUTCMonth(result.getUTCMonth() + amount);
      return result;
    case "quarter":
      result.setUTCMonth(result.getUTCMonth() + amount * 3);
      return result;
    case "year":
      result.setUTCFullYear(result.getUTCFullYear() + amount);
      return result;
  }
}

export function diffDates(from: Date, to: Date, unit: TimeUnitValue): number {
  const ms = to.getTime() - from.getTime();
  if (!isCalendarUnit(unit)) return ms / UNIT_MS[unit];

  const months =
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - from.getUTCMonth()) +
    (to.getUTCDate() - from.getUTCDate()) / 30;
  if (unit === "month") return months;
  if (unit === "quarter") return months / 3;
  return months / 12;
}

const baseSchema = z.object({
  operation: z
    .enum(["now", "format", "convert", "add", "diff"])
    .default("now")
    .describe(
      "now: current time. format: describe a date. convert: express a date in another timezone. " +
        "add: add/subtract a duration. diff: difference between two dates.",
    ),
  datetime: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .optional()
    .describe(
      'Date to work with (ISO 8601, "now", or unix timestamp). Defaults to now. Used by format/convert/add; as the start date for diff.',
    ),
  timezone: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .describe(
      'IANA timezone for output, e.g. "UTC", "America/New_York". Defaults to "UTC". For convert, this is the source display zone when "toTimezone" is set.',
    ),
  toTimezone: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .describe(
      'Target IANA timezone for convert, e.g. "Asia/Tokyo". Only used by convert.',
    ),
  to: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .optional()
    .describe('End date for diff (ISO 8601, "now", or unix timestamp).'),
  amount: z
    .number()
    .int()
    .min(-1_000_000)
    .max(1_000_000)
    .optional()
    .describe("Amount to add (negative to subtract). Only used by add."),
  unit: TimeUnit.optional().describe(
    "Time unit for add/diff. Required by add and diff.",
  ),
});

export const datetimeTool = tool(
  async (input) => {
    const { operation } = input;
    const timezone = resolveTimeZone(input.timezone);

    switch (operation) {
      case "now": {
        return JSON.stringify({
          operation,
          now: describeDate(new Date(), timezone),
        });
      }

      case "format": {
        const date = parseDateInput(input.datetime, "datetime");
        return JSON.stringify({
          operation,
          input: input.datetime ?? "now",
          date: describeDate(date, timezone),
        });
      }

      case "convert": {
        if (!input.datetime)
          throw new Error('"datetime" is required for convert.');
        if (!input.toTimezone)
          throw new Error('"toTimezone" is required for convert.');
        const date = parseDateInput(input.datetime, "datetime");
        const target = resolveTimeZone(input.toTimezone);
        return JSON.stringify({
          operation,
          input: input.datetime,
          from: describeDate(date, timezone),
          to: describeDate(date, target),
        });
      }

      case "add": {
        if (!input.datetime)
          throw new Error('"datetime" is required for add.');
        if (input.amount === undefined)
          throw new Error('"amount" is required for add.');
        if (!input.unit) throw new Error('"unit" is required for add.');
        const date = parseDateInput(input.datetime, "datetime");
        const result = addToDate(date, input.amount, input.unit);
        return JSON.stringify({
          operation,
          input: input.datetime,
          amount: input.amount,
          unit: input.unit,
          result: describeDate(result, timezone),
        });
      }

      case "diff": {
        if (!input.datetime)
          throw new Error('"datetime" (start date) is required for diff.');
        if (!input.to) throw new Error('"to" (end date) is required for diff.');
        if (!input.unit) throw new Error('"unit" is required for diff.');
        const from = parseDateInput(input.datetime, "datetime");
        const to = parseDateInput(input.to, "to");
        const value = diffDates(from, to, input.unit);
        return JSON.stringify({
          operation,
          from: describeDate(from, timezone),
          to: describeDate(to, timezone),
          unit: input.unit,
          difference: Number.parseFloat(value.toPrecision(12)),
          differenceMs: to.getTime() - from.getTime(),
        });
      }
    }
  },
  {
    name: "datetime",
    description:
      "Date and time utility. Get the current time (now), describe/format a date, " +
      'convert a date between IANA timezones, add/subtract a duration, or compute the ' +
      'difference between two dates. Accepts ISO 8601 strings, "now", or unix timestamps. ' +
      "Returns ISO, unix, UTC, locale strings, components, and timezone offsets.",
    schema: baseSchema,
  },
);
