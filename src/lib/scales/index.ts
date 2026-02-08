import { scaleLinear, scaleLog, scaleSqrt, scalePow, scaleTime, scaleBand, scaleOrdinal, scalePoint } from 'd3-scale';
import type { ScaleType } from '../types/index.js';

/**
 * Create a scale based on type
 */
export function createScale(type: ScaleType = 'linear') {
switch (type) {
case 'linear':
return scaleLinear();
case 'log':
return scaleLog();
case 'sqrt':
return scaleSqrt();
case 'pow':
return scalePow();
case 'time':
return scaleTime();
case 'band':
return scaleBand();
case 'ordinal':
return scaleOrdinal();
case 'point':
return scalePoint();
default:
return scaleLinear();
}
}

/**
 * Calculate nice domain values for a scale
 */
export function getNiceDomain(values: number[], padding: number = 0.1): [number, number] {
if (values.length === 0) return [0, 1];

// Use loop instead of spread to avoid argument limits
let min = values[0]!;
let max = values[0]!;
for (let i = 1; i < values.length; i++) {
const val = values[i]!;
if (val < min) min = val;
if (val > max) max = val;
}

const range = max - min;
const paddedRange = range * padding;

return [min - paddedRange, max + paddedRange];
}

/**
 * Generate tick values for a scale
 */
export function getTicks(domain: [number, number], count: number = 10): number[] {
// Guard against invalid count
if (count <= 0) return [];
if (count === 1) return [(domain[0] + domain[1]) / 2];

const [min, max] = domain;
const range = max - min;
const step = range / (count - 1);

const ticks: number[] = [];
for (let i = 0; i < count; i++) {
ticks.push(min + step * i);
}

return ticks;
}

/**
 * Format tick values
 */
export function formatTick(value: number | Date, type: ScaleType = 'linear'): string {
if (type === 'time' && value instanceof Date) {
return value.toLocaleDateString();
}

if (typeof value === 'number') {
// Format large numbers with suffixes
if (Math.abs(value) >= 1e9) {
return `${(value / 1e9).toFixed(1)}B`;
}
if (Math.abs(value) >= 1e6) {
return `${(value / 1e6).toFixed(1)}M`;
}
if (Math.abs(value) >= 1e3) {
return `${(value / 1e3).toFixed(1)}K`;
}

// Format small numbers with appropriate precision
if (Math.abs(value) < 1 && value !== 0) {
return value.toFixed(2);
}

return value.toString();
}

return String(value);
}

export { scaleLinear, scaleLog, scaleSqrt, scalePow, scaleTime, scaleBand, scaleOrdinal, scalePoint };
