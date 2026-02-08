import type { Theme } from '../types/index.js';

/**
 * Default theme configuration
 */
export const defaultTheme: Theme = {
	colors: {
		primary: '#4299e1',
		secondary: '#48bb78',
		background: '#ffffff',
		text: '#2d3748',
		grid: '#e2e8f0',
		axis: '#1a202c'
	},
	fonts: {
		family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
		size: {
			small: 10,
			medium: 12,
			large: 16
		}
	},
	stroke: {
		width: 2
	}
};

/**
 * Dark theme configuration
 */
export const darkTheme: Theme = {
	colors: {
		primary: '#63b3ed',
		secondary: '#68d391',
		background: '#1a202c',
		text: '#e2e8f0',
		grid: '#2d3748',
		axis: '#cbd5e0'
	},
	fonts: {
		family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
		size: {
			small: 10,
			medium: 12,
			large: 16
		}
	},
	stroke: {
		width: 2
	}
};

/**
 * Color palettes for charts
 */
export const colorPalettes = {
	default: ['#4299e1', '#48bb78', '#ed8936', '#9f7aea', '#f56565', '#38b2ac', '#ecc94b', '#ed64a6'],
	pastel: ['#a7c5eb', '#b4ddb4', '#f5c6a5', '#d4c5f9', '#f9b5ad', '#a4d4d9', '#f9e2ae', '#f5b8d4'],
	vibrant: ['#0077cc', '#00cc88', '#ff8800', '#7733ff', '#ff3366', '#00bbbb', '#ffcc00', '#ff0088'],
	monochrome: ['#333333', '#555555', '#777777', '#999999', '#bbbbbb', '#dddddd', '#eeeeee', '#f9f9f9']
};

/**
 * Get color from palette by index
 */
export function getColorFromPalette(palette: string[], index: number): string {
	return palette[index % palette.length] || palette[0] || '#000000';
}

/**
 * Merge theme with defaults
 */
export function mergeTheme(customTheme: Partial<Theme>): Theme {
	return {
		colors: { ...defaultTheme.colors, ...customTheme.colors },
		fonts: {
			family: customTheme.fonts?.family || defaultTheme.fonts.family,
			size: { ...defaultTheme.fonts.size, ...customTheme.fonts?.size }
		},
		stroke: { ...defaultTheme.stroke, ...customTheme.stroke }
	};
}
