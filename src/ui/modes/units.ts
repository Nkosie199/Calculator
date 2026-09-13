import { convertLinear, convertTemperature, UNIT_TABLES, type UnitCategory } from '../../core/units';
import { CalcError } from '../../core/parser';

const TEMPERATURE_UNITS = ['celsius', 'fahrenheit', 'kelvin'];

const LABELS: Record<string, string> = {
  meter: 'Meter',
  kilometer: 'Kilometer',
  centimeter: 'Centimeter',
  millimeter: 'Millimeter',
  mile: 'Mile',
  yard: 'Yard',
  foot: 'Foot',
  inch: 'Inch',
  nauticalMile: 'Nautical mile',
  kilogram: 'Kilogram',
  gram: 'Gram',
  milligram: 'Milligram',
  tonne: 'Tonne',
  pound: 'Pound',
  ounce: 'Ounce',
  stone: 'Stone',
  liter: 'Liter',
  milliliter: 'Milliliter',
  cubicMeter: 'Cubic meter',
  gallonUS: 'Gallon (US)',
  quartUS: 'Quart (US)',
  pintUS: 'Pint (US)',
  cupUS: 'Cup (US)',
  fluidOunceUS: 'Fluid ounce (US)',
  meterPerSecond: 'Meters/second',
  kilometerPerHour: 'Km/hour',
  milePerHour: 'Miles/hour',
  knot: 'Knot',
  footPerSecond: 'Feet/second',
  byte: 'Byte',
  bit: 'Bit',
  kilobyte: 'Kilobyte',
  megabyte: 'Megabyte',
  gigabyte: 'Gigabyte',
  terabyte: 'Terabyte',
  second: 'Second',
  millisecond: 'Millisecond',
  minute: 'Minute',
  hour: 'Hour',
  day: 'Day',
  week: 'Week',
  year: 'Year',
  celsius: 'Celsius',
  fahrenheit: 'Fahrenheit',
  kelvin: 'Kelvin',
};

function unitsForCategory(category: UnitCategory): string[] {
  return category === 'temperature' ? TEMPERATURE_UNITS : Object.keys(UNIT_TABLES[category]);
}

function populateUnitSelects(): void {
  const category = (document.getElementById('unitsCategory') as HTMLSelectElement).value as UnitCategory;
  const units = unitsForCategory(category);
  const fromSelect = document.getElementById('unitsFrom') as HTMLSelectElement;
  const toSelect = document.getElementById('unitsTo') as HTMLSelectElement;

  for (const select of [fromSelect, toSelect]) {
    select.innerHTML = '';
    for (const unit of units) {
      const option = document.createElement('option');
      option.value = unit;
      option.textContent = LABELS[unit] ?? unit;
      select.appendChild(option);
    }
  }
  if (units.length > 1) toSelect.selectedIndex = 1;
}

function convert(): void {
  const category = (document.getElementById('unitsCategory') as HTMLSelectElement).value as UnitCategory;
  const value = Number((document.getElementById('unitsValue') as HTMLInputElement).value);
  const from = (document.getElementById('unitsFrom') as HTMLSelectElement).value;
  const to = (document.getElementById('unitsTo') as HTMLSelectElement).value;
  const errorEl = document.getElementById('unitsError') as HTMLParagraphElement;
  const resultEl = document.getElementById('unitsResult') as HTMLParagraphElement;

  errorEl.textContent = '';
  try {
    const result =
      category === 'temperature'
        ? convertTemperature(value, from as never, to as never)
        : convertLinear(value, category, from, to);
    resultEl.textContent = `${value} ${LABELS[from] ?? from} = ${Number(result.toPrecision(10))} ${LABELS[to] ?? to}`;
  } catch (e) {
    resultEl.textContent = '';
    errorEl.textContent = e instanceof CalcError ? e.message : 'Invalid conversion';
  }
}

let initialized = false;

export function initUnitsMode(): void {
  if (initialized) return;
  initialized = true;

  document.getElementById('unitsCategory')!.addEventListener('change', () => {
    populateUnitSelects();
    convert();
  });
  document.getElementById('unitsValue')!.addEventListener('input', convert);
  document.getElementById('unitsFrom')!.addEventListener('change', convert);
  document.getElementById('unitsTo')!.addEventListener('change', convert);

  populateUnitSelects();
  convert();
}
