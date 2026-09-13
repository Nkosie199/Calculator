import { describe, expect, it } from 'vitest';
import { convertLinear, convertTemperature } from '../units';

describe('convertLinear', () => {
  it('length: km to miles', () => {
    expect(convertLinear(1, 'length', 'kilometer', 'mile')).toBeCloseTo(0.621371, 5);
  });
  it('length: meters to centimeters', () => {
    expect(convertLinear(1, 'length', 'meter', 'centimeter')).toBeCloseTo(100, 10);
  });
  it('mass: kilogram to pound', () => {
    expect(convertLinear(1, 'mass', 'kilogram', 'pound')).toBeCloseTo(2.20462, 4);
  });
  it('data: gigabyte to megabyte', () => {
    expect(convertLinear(1, 'data', 'gigabyte', 'megabyte')).toBeCloseTo(1024, 10);
  });
  it('time: hour to minute', () => {
    expect(convertLinear(1, 'time', 'hour', 'minute')).toBe(60);
  });
  it('is reflexive: converting a unit to itself is a no-op', () => {
    expect(convertLinear(7, 'length', 'mile', 'mile')).toBeCloseTo(7, 10);
  });
  it('throws for an unknown unit', () => {
    expect(() => convertLinear(1, 'length', 'meter', 'furlong')).toThrow();
  });
});

describe('convertTemperature', () => {
  it('0C = 32F', () => {
    expect(convertTemperature(0, 'celsius', 'fahrenheit')).toBeCloseTo(32, 10);
  });
  it('100C = 212F', () => {
    expect(convertTemperature(100, 'celsius', 'fahrenheit')).toBeCloseTo(212, 10);
  });
  it('0C = 273.15K', () => {
    expect(convertTemperature(0, 'celsius', 'kelvin')).toBeCloseTo(273.15, 10);
  });
  it('absolute zero round-trips', () => {
    expect(convertTemperature(-273.15, 'celsius', 'kelvin')).toBeCloseTo(0, 10);
    expect(convertTemperature(0, 'kelvin', 'celsius')).toBeCloseTo(-273.15, 10);
  });
  it('is reflexive', () => {
    expect(convertTemperature(42, 'fahrenheit', 'fahrenheit')).toBe(42);
  });
});
