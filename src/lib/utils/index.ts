import type { PancakePoint, PancakeCoordinates } from '../types/index.js';

/**
 * Converts Pancake coordinates (0-100) to pixel coordinates
 */
export function pancakeToPixels(
	pancakeValue: number,
	pixelDimension: number
): number {
	return (pancakeValue / 100) * pixelDimension;
}

/**
 * Converts pixel coordinates to Pancake coordinates (0-100)
 */
export function pixelsToPancake(
	pixelValue: number,
	pixelDimension: number
): number {
	return (pixelValue / pixelDimension) * 100;
}

/**
 * Converts a Pancake point to pixel coordinates
 */
export function pancakePointToPixels(
	point: PancakePoint,
	width: number,
	height: number
): { x: number; y: number } {
	return {
		x: pancakeToPixels(point.x, width),
		y: pancakeToPixels(point.y, height)
	};
}

/**
 * Converts Pancake coordinates to pixel coordinates
 */
export function pancakeCoordsToPixels(
	coords: PancakeCoordinates,
	width: number,
	height: number
): { x1: number; y1: number; x2: number; y2: number } {
	return {
		x1: pancakeToPixels(coords.x1, width),
		y1: pancakeToPixels(coords.y1, height),
		x2: pancakeToPixels(coords.x2, width),
		y2: pancakeToPixels(coords.y2, height)
	};
}

/**
 * Clamps a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, t: number): number {
	return start + (end - start) * t;
}

/**
 * Generates an array of evenly spaced values
 */
export function range(start: number, end: number, count: number): number[] {
	const result: number[] = [];
	const step = (end - start) / (count - 1);
	for (let i = 0; i < count; i++) {
		result.push(start + step * i);
	}
	return result;
}

/**
 * Formats a number with specified decimal places
 */
export function formatNumber(value: number, decimals: number = 2): string {
	return value.toFixed(decimals);
}

/**
 * Generates a unique ID
 */
let idCounter = 0;
export function uniqueId(prefix: string = 'chart'): string {
	return `${prefix}-${++idCounter}`;
}
