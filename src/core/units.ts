import { CalcError } from './parser/errors';

/** Every table maps a unit name to how many of the category's base unit one of it equals. Static, offline, no live rates. */

export const LENGTH_UNITS = {
  meter: 1,
  kilometer: 1000,
  centimeter: 0.01,
  millimeter: 0.001,
  mile: 1609.344,
  yard: 0.9144,
  foot: 0.3048,
  inch: 0.0254,
  nauticalMile: 1852,
} as const;

export const MASS_UNITS = {
  kilogram: 1,
  gram: 0.001,
  milligram: 1e-6,
  tonne: 1000,
  pound: 0.45359237,
  ounce: 0.028349523125,
  stone: 6.35029318,
} as const;

export const VOLUME_UNITS = {
  liter: 1,
  milliliter: 0.001,
  cubicMeter: 1000,
  gallonUS: 3.785411784,
  quartUS: 0.946352946,
  pintUS: 0.473176473,
  cupUS: 0.2365882365,
  fluidOunceUS: 0.0295735295625,
} as const;

export const SPEED_UNITS = {
  meterPerSecond: 1,
  kilometerPerHour: 1 / 3.6,
  milePerHour: 0.44704,
  knot: 0.5144444444444445,
  footPerSecond: 0.3048,
} as const;

/** Binary (1024-based) data sizes, as is conventional for KB/MB/GB in most software contexts. */
export const DATA_UNITS = {
  byte: 1,
  bit: 1 / 8,
  kilobyte: 1024,
  megabyte: 1024 ** 2,
  gigabyte: 1024 ** 3,
  terabyte: 1024 ** 4,
} as const;

export const TIME_UNITS = {
  second: 1,
  millisecond: 0.001,
  minute: 60,
  hour: 3600,
  day: 86400,
  week: 604800,
  year: 31557600, // Julian year: 365.25 days
} as const;

export type LengthUnit = keyof typeof LENGTH_UNITS;
export type MassUnit = keyof typeof MASS_UNITS;
export type VolumeUnit = keyof typeof VOLUME_UNITS;
export type SpeedUnit = keyof typeof SPEED_UNITS;
export type DataUnit = keyof typeof DATA_UNITS;
export type TimeUnit = keyof typeof TIME_UNITS;
export type TemperatureUnit = 'celsius' | 'fahrenheit' | 'kelvin';

export type UnitCategory = 'length' | 'mass' | 'volume' | 'speed' | 'data' | 'time' | 'temperature';

export const UNIT_TABLES: Record<Exclude<UnitCategory, 'temperature'>, Record<string, number>> = {
  length: LENGTH_UNITS,
  mass: MASS_UNITS,
  volume: VOLUME_UNITS,
  speed: SPEED_UNITS,
  data: DATA_UNITS,
  time: TIME_UNITS,
};

/** Converts between two units in the same linear (proportional-to-a-base-unit) category. */
export function convertLinear(value: number, category: Exclude<UnitCategory, 'temperature'>, from: string, to: string): number {
  const table = UNIT_TABLES[category];
  const fromFactor = table[from];
  const toFactor = table[to];
  if (fromFactor === undefined || toFactor === undefined) {
    throw new CalcError('invalid-input', `Unknown ${category} unit`);
  }
  return (value * fromFactor) / toFactor;
}

function toCelsius(value: number, unit: TemperatureUnit): number {
  switch (unit) {
    case 'celsius':
      return value;
    case 'fahrenheit':
      return ((value - 32) * 5) / 9;
    case 'kelvin':
      return value - 273.15;
  }
}

function fromCelsius(value: number, unit: TemperatureUnit): number {
  switch (unit) {
    case 'celsius':
      return value;
    case 'fahrenheit':
      return (value * 9) / 5 + 32;
    case 'kelvin':
      return value + 273.15;
  }
}

/** Temperature isn't a simple ratio (0 degrees isn't "no temperature"), so it needs its own conversion. */
export function convertTemperature(value: number, from: TemperatureUnit, to: TemperatureUnit): number {
  return fromCelsius(toCelsius(value, from), to);
}
