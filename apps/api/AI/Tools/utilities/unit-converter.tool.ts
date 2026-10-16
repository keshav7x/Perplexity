import { tool } from "@langchain/core/tools";
import { z } from "zod";

type LinearUnitDef = {
  factor: number; // Amount of base units in one of this unit.
  aliases: string[];
};

type CategoryDef = {
  base: string;
  units: Record<string, LinearUnitDef>;
};

const CATEGORIES: Record<string, CategoryDef> = {
  length: {
    base: "meter",
    units: {
      millimeter: { factor: 0.001, aliases: ["mm", "millimeter", "millimeters"] },
      centimeter: { factor: 0.01, aliases: ["cm", "centimeter", "centimeters"] },
      meter: { factor: 1, aliases: ["m", "meter", "meters", "metre", "metres"] },
      kilometer: { factor: 1000, aliases: ["km", "kilometer", "kilometers", "kilometre", "kilometres"] },
      inch: { factor: 0.0254, aliases: ["in", "inch", "inches"] },
      foot: { factor: 0.3048, aliases: ["ft", "foot", "feet"] },
      yard: { factor: 0.9144, aliases: ["yd", "yard", "yards"] },
      mile: { factor: 1609.344, aliases: ["mi", "mile", "miles"] },
      nautical_mile: { factor: 1852, aliases: ["nmi", "nauticalmile", "nauticalmiles"] },
    },
  },
  mass: {
    base: "kilogram",
    units: {
      milligram: { factor: 1e-6, aliases: ["mg", "milligram", "milligrams"] },
      gram: { factor: 0.001, aliases: ["g", "gram", "grams"] },
      kilogram: { factor: 1, aliases: ["kg", "kilogram", "kilograms"] },
      tonne: {
        factor: 1000,
        aliases: ["t", "ton", "tons", "tonne", "tonnes", "metricton", "metrictons"],
      },
      short_ton: { factor: 907.18474, aliases: ["shortton", "shorttons", "uston", "ustons"] },
      long_ton: { factor: 1016.0469088, aliases: ["longton", "longtons", "ukton", "uktons"] },
      ounce: { factor: 0.028349523125, aliases: ["oz", "ounce", "ounces"] },
      pound: { factor: 0.45359237, aliases: ["lb", "lbs", "pound", "pounds"] },
      stone: { factor: 6.35029318, aliases: ["st", "stone", "stones"] },
    },
  },
  volume: {
    base: "liter",
    units: {
      milliliter: { factor: 0.001, aliases: ["ml", "milliliter", "milliliters", "millilitre", "millilitres", "cc", "cm3", "cubiccentimeter", "cubiccentimeters"] },
      liter: { factor: 1, aliases: ["l", "liter", "liters", "litre", "litres"] },
      cubic_meter: { factor: 1000, aliases: ["m3", "cubicmeter", "cubicmeters"] },
      teaspoon_us: { factor: 0.00492892159375, aliases: ["tsp", "teaspoon", "teaspoons"] },
      tablespoon_us: { factor: 0.01478676478125, aliases: ["tbsp", "tablespoon", "tablespoons"] },
      fluid_ounce_us: { factor: 0.0295735295625, aliases: ["floz", "fluidounce", "fluidounces"] },
      cup_us: { factor: 0.2365882365, aliases: ["cup", "cups"] },
      pint_us: { factor: 0.473176473, aliases: ["pt", "pint", "pints"] },
      quart_us: { factor: 0.946352946, aliases: ["qt", "quart", "quarts"] },
      gallon_us: { factor: 3.785411784, aliases: ["gal", "gallon", "gallons"] },
      cubic_inch: { factor: 0.016387064, aliases: ["in3", "cubicinch", "cubicinches"] },
      cubic_foot: { factor: 28.316846592, aliases: ["ft3", "cubicfoot", "cubicfeet"] },
    },
  },
  area: {
    base: "square_meter",
    units: {
      square_millimeter: { factor: 1e-6, aliases: ["mm2", "squaremillimeter", "squaremillimeters"] },
      square_centimeter: { factor: 1e-4, aliases: ["cm2", "squarecentimeter", "squarecentimeters"] },
      square_meter: { factor: 1, aliases: ["m2", "sqm", "squaremeter", "squaremeters"] },
      hectare: { factor: 10_000, aliases: ["ha", "hectare", "hectares"] },
      square_kilometer: { factor: 1e6, aliases: ["km2", "squarekilometer", "squarekilometers"] },
      square_inch: { factor: 0.00064516, aliases: ["in2", "squareinch", "squareinches", "sqin"] },
      square_foot: { factor: 0.09290304, aliases: ["ft2", "squarefoot", "squarefeet", "sqft"] },
      square_yard: { factor: 0.83612736, aliases: ["yd2", "squareyard", "squareyards", "sqyd"] },
      acre: { factor: 4046.8564224, aliases: ["acre", "acres"] },
      square_mile: { factor: 2589988.110336, aliases: ["mi2", "squaremile", "squaremiles", "sqmi"] },
    },
  },
  speed: {
    base: "meter_per_second",
    units: {
      meter_per_second: {
        factor: 1,
        aliases: ["m/s", "mps", "meterpersecond", "meterspersecond"],
      },
      kilometer_per_hour: {
        factor: 1 / 3.6,
        aliases: ["km/h", "kmh", "kph", "kilometerperhour", "kilometersperhour"],
      },
      mile_per_hour: { factor: 0.44704, aliases: ["mph", "mileperhour", "milesperhour"] },
      foot_per_second: { factor: 0.3048, aliases: ["fps", "ft/s", "footpersecond", "feetpersecond"] },
      knot: { factor: 0.5144444444444445, aliases: ["kn", "kt", "knot", "knots"] },
    },
  },
  time: {
    base: "second",
    units: {
      millisecond: { factor: 0.001, aliases: ["ms", "millisecond", "milliseconds"] },
      second: { factor: 1, aliases: ["s", "sec", "secs", "second", "seconds"] },
      minute: { factor: 60, aliases: ["min", "mins", "minute", "minutes"] },
      hour: { factor: 3600, aliases: ["h", "hr", "hrs", "hour", "hours"] },
      day: { factor: 86_400, aliases: ["d", "day", "days"] },
      week: { factor: 604_800, aliases: ["wk", "wks", "week", "weeks"] },
      month: { factor: 2_629_800, aliases: ["month", "months"] },
      year: { factor: 31_557_600, aliases: ["yr", "yrs", "year", "years"] },
    },
  },
  pressure: {
    base: "pascal",
    units: {
      pascal: { factor: 1, aliases: ["pa", "pascal", "pascals"] },
      kilopascal: { factor: 1000, aliases: ["kpa", "kilopascal", "kilopascals"] },
      bar: { factor: 100_000, aliases: ["bar", "bars"] },
      psi: { factor: 6894.757293178, aliases: ["psi"] },
      atmosphere: { factor: 101_325, aliases: ["atm", "atmosphere", "atmospheres"] },
      mmhg: { factor: 133.322387415, aliases: ["mmhg", "torr"] },
    },
  },
  energy: {
    base: "joule",
    units: {
      joule: { factor: 1, aliases: ["j", "joule", "joules"] },
      kilojoule: { factor: 1000, aliases: ["kj", "kilojoule", "kilojoules"] },
      calorie: { factor: 4.184, aliases: ["cal", "calorie", "calories"] },
      kilocalorie: { factor: 4184, aliases: ["kcal", "kilocalorie", "kilocalories"] },
      watt_hour: { factor: 3600, aliases: ["wh", "watthour", "watthours"] },
      kilowatt_hour: { factor: 3.6e6, aliases: ["kwh", "kilowatthour", "kilowatthours"] },
      btu: { factor: 1055.05585262, aliases: ["btu", "btus"] },
      electronvolt: { factor: 1.602176634e-19, aliases: ["ev", "electronvolt", "electronvolts"] },
    },
  },
  power: {
    base: "watt",
    units: {
      watt: { factor: 1, aliases: ["w", "watt", "watts"] },
      kilowatt: { factor: 1000, aliases: ["kw", "kilowatt", "kilowatts"] },
      megawatt: { factor: 1e6, aliases: ["mw", "megawatt", "megawatts"] },
      horsepower: { factor: 745.6998715822702, aliases: ["hp", "horsepower"] },
    },
  },
  data: {
    base: "byte",
    units: {
      bit: { factor: 0.125, aliases: ["bit", "bits"] },
      kilobit: { factor: 125, aliases: ["kilobit", "kilobits", "kbit", "kbits"] },
      megabit: { factor: 125_000, aliases: ["megabit", "megabits", "mbit", "mbits"] },
      gigabit: { factor: 125_000_000, aliases: ["gigabit", "gigabits", "gbit", "gbits"] },
      byte: { factor: 1, aliases: ["b", "byte", "bytes"] },
      kilobyte: { factor: 1000, aliases: ["kb", "kbyte", "kbytes", "kilobyte", "kilobytes"] },
      megabyte: { factor: 1e6, aliases: ["mb", "mbyte", "mbytes", "megabyte", "megabytes"] },
      gigabyte: { factor: 1e9, aliases: ["gb", "gbyte", "gbytes", "gigabyte", "gigabytes"] },
      terabyte: { factor: 1e12, aliases: ["tb", "tbyte", "tbytes", "terabyte", "terabytes"] },
      kibibyte: { factor: 1024, aliases: ["kib", "kibibyte", "kibibytes"] },
      mebibyte: { factor: 1_048_576, aliases: ["mib", "mebibyte", "mebibytes"] },
      gibibyte: { factor: 1_073_741_824, aliases: ["gib", "gibibyte", "gibibytes"] },
      tebibyte: { factor: 1_099_511_627_776, aliases: ["tib", "tebibyte", "tebibytes"] },
    },
  },
  angle: {
    base: "radian",
    units: {
      radian: { factor: 1, aliases: ["rad", "radian", "radians"] },
      degree: { factor: Math.PI / 180, aliases: ["deg", "degree", "degrees"] },
      arcminute: { factor: Math.PI / 10_800, aliases: ["arcmin", "arcminute", "arcminutes"] },
      arcsecond: { factor: Math.PI / 648_000, aliases: ["arcsec", "arcsecond", "arcseconds"] },
      gradian: { factor: Math.PI / 200, aliases: ["grad", "gradian", "gradians", "gon"] },
      turn: { factor: 2 * Math.PI, aliases: ["turn", "turns", "rev", "revs", "revolution", "revolutions"] },
    },
  },
};

const TEMPERATURE_ALIASES: Record<string, "celsius" | "fahrenheit" | "kelvin" | "rankine"> = {
  c: "celsius",
  celsius: "celsius",
  centigrade: "celsius",
  f: "fahrenheit",
  fahrenheit: "fahrenheit",
  k: "kelvin",
  kelvin: "kelvin",
  r: "rankine",
  rankine: "rankine",
};

export function normalizeUnitName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[²]/g, "2")
    .replace(/[³]/g, "3")
    .replace(/[°]/g, "")
    .replace(/[\s_\-]+/g, "");
}

export function resolveCategory(name: string | undefined): string {
  const key = (name ?? "").trim().toLowerCase().replace(/[\s_\-]+/g, "");
  if (key === "") throw new Error('"category" must not be empty.');
  if (!Object.hasOwn(CATEGORIES, key))
    throw new Error(
      `Unknown category: "${name}". Available: ${Object.keys(CATEGORIES).join(", ")}, temperature.`,
    );
  return key;
}

export function findUnit(name: string): {
  category: string;
  canonical: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
} {
  const raw = (name ?? "").trim();
  if (raw.length === 0) throw new Error("Unit name must not be empty.");
  const normalized = normalizeUnitName(raw);

  const temp = TEMPERATURE_ALIASES[normalized];
  if (temp) {
    const toBase = (v: number): number => {
      switch (temp) {
        case "celsius":
          return v + 273.15;
        case "fahrenheit":
          return ((v - 32) * 5) / 9 + 273.15;
        case "kelvin":
          return v;
        case "rankine":
          return (v * 5) / 9;
      }
    };
    const fromBase = (k: number): number => {
      switch (temp) {
        case "celsius":
          return k - 273.15;
        case "fahrenheit":
          return ((k - 273.15) * 9) / 5 + 32;
        case "kelvin":
          return k;
        case "rankine":
          return (k * 9) / 5;
      }
    };
    return { category: "temperature", canonical: temp, toBase, fromBase };
  }

  for (const [category, def] of Object.entries(CATEGORIES)) {
    for (const [canonical, unit] of Object.entries(def.units)) {
      if (canonical === normalized || unit.aliases.includes(normalized)) {
        return {
          category,
          canonical,
          toBase: (v: number) => v * unit.factor,
          fromBase: (v: number) => v / unit.factor,
        };
      }
    }
  }
  throw new Error(
    `Unknown unit: "${raw}". Try operation "list" with a category to see supported units.`,
  );
}

function cleanNumber(value: number): number {
  if (typeof value !== "number" || Number.isNaN(value))
    throw new Error("Conversion result is not a number.");
  if (!Number.isFinite(value))
    throw new Error("Conversion result is not finite (overflow).");
  return Number.parseFloat(value.toPrecision(12));
}

export function convertUnits(value: number, from: string, to: string): {
  result: number;
  category: string;
  fromCanonical: string;
  toCanonical: string;
  rate: number | null;
} {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value))
    throw new Error(`"value" must be a finite number, got: ${value}.`);
  if (Math.abs(value) > 1e15)
    throw new Error('"value" is out of range (max absolute value 1e15).');

  const fromUnit = findUnit(from);
  const toUnit = findUnit(to);

  if (fromUnit.category !== toUnit.category)
    throw new Error(
      `Incompatible units: "${from}" is ${fromUnit.category}, "${to}" is ${toUnit.category}.`,
    );

  const baseValue = fromUnit.toBase(value);
  if (fromUnit.category === "temperature" && baseValue < 0)
    throw new Error("Temperature is below absolute zero.");
  // No single multiplicative rate exists for offset scales (C/F/K/R).
  const rate = fromUnit.category === "temperature" ? null : cleanNumber(toUnit.fromBase(fromUnit.toBase(1)));
  return {
    result: cleanNumber(toUnit.fromBase(baseValue)),
    category: fromUnit.category,
    fromCanonical: fromUnit.canonical,
    toCanonical: toUnit.canonical,
    rate,
  };
}

export function listCategoryUnits(category: string): {
  category: string;
  base: string;
  units: Array<{ unit: string; aliases: string[]; factorInBase: number | null }>;
} {
  if (category.trim().toLowerCase() === "temperature") {
    return {
      category: "temperature",
      base: "kelvin",
      units: [
        { unit: "celsius", aliases: ["c", "celsius", "centigrade"], factorInBase: null },
        { unit: "fahrenheit", aliases: ["f", "fahrenheit"], factorInBase: null },
        { unit: "kelvin", aliases: ["k", "kelvin"], factorInBase: null },
        { unit: "rankine", aliases: ["r", "rankine"], factorInBase: null },
      ],
    };
  }
  const key = resolveCategory(category);
  const def = CATEGORIES[key]!;
  return {
    category: key,
    base: def.base,
    units: Object.entries(def.units).map(([unit, u]) => ({
      unit,
      aliases: u.aliases,
      factorInBase: u.factor,
    })),
  };
}

const schema = z.object({
  operation: z
    .enum(["convert", "list"])
    .default("convert")
    .describe("convert: convert a value between units. list: show supported units in a category."),
  value: z
    .number()
    .optional()
    .describe("Numeric value to convert. Required by convert."),
  from: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .describe('Source unit, e.g. "km", "fahrenheit", "gallon". Required by convert.'),
  to: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .describe('Target unit, e.g. "miles", "celsius", "liter". Required by convert.'),
  category: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .describe(
      "Category for list (required by list), or an optional check for convert. " +
        "One of: length, mass, temperature, volume, area, speed, time, pressure, energy, power, data, angle.",
    ),
});

export const unitConverterTool = tool(
  async (input) => {
    const { operation } = input;

    if (operation === "list") {
      if (!input.category) throw new Error('"category" is required for list.');
      return JSON.stringify({ operation, ...listCategoryUnits(input.category) });
    }

    if (input.value === undefined) throw new Error('"value" is required for convert.');
    if (!input.from) throw new Error('"from" unit is required for convert.');
    if (!input.to) throw new Error('"to" unit is required for convert.');

    const { result, category, fromCanonical, toCanonical, rate } = convertUnits(
      input.value,
      input.from,
      input.to,
    );

    if (input.category) {
      const expected =
        input.category.trim().toLowerCase() === "temperature"
          ? "temperature"
          : resolveCategory(input.category);
      if (expected !== category)
        throw new Error(
          `Units "${input.from}" and "${input.to}" are ${category}, not ${expected}.`,
        );
    }

    return JSON.stringify({
      operation,
      value: input.value,
      from: fromCanonical,
      to: toCanonical,
      category,
      result,
      rate,
    });
  },
  {
    name: "unit_converter",
    description:
      "Convert a numeric value between units within the same category, or list supported units. " +
      "Categories: length, mass, temperature (C/F/K/Rankine), volume (US customary + metric), " +
      "area, speed, time (month = 30.4375 days avg, year = 365.25 days avg), pressure, energy, " +
      "power, data (SI decimal KB/MB vs binary KiB/MiB), angle. " +
      '"ton" means metric tonne; use "short_ton"/"long_ton" for US/UK tons; "gal"/"cup"/"floz" are US measures.',
    schema,
  },
);
