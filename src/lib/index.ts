// Main components
export { Chart, Line, Bar, Scatter, Area, Pie, Axis, Grid, Legend } from './components/index.js';

// Renderers
export { SVGRenderer, CanvasRenderer, WebGPURenderer } from './renderers/index.js';

// Core utilities
export { setChartContext, getChartContext, createRenderer, defaultTheme, darkTheme, colorPalettes, getColorFromPalette, mergeTheme } from './core/index.js';
export type { ChartContext } from './core/index.js';

// Scales
export {
	createScale,
	getNiceDomain,
	getTicks,
	formatTick,
	scaleLinear,
	scaleLog,
	scaleSqrt,
	scalePow,
	scaleTime,
	scaleBand,
	scaleOrdinal,
	scalePoint
} from './scales/index.js';

// Utilities
export {
	pancakeToPixels,
	pixelsToPancake,
	pancakePointToPixels,
	pancakeCoordsToPixels,
	clamp,
	lerp,
	range,
	formatNumber,
	uniqueId
} from './utils/index.js';

// Types
export type {
	PancakeCoordinates,
	PancakePoint,
	RenderTarget,
	Renderer,
	TextOptions,
	Margin,
	ScaleType,
	Scale,
	DataPoint,
	AxisConfig,
	Theme,
	AnimationOptions,
	TooltipConfig,
	LegendConfig,
	LegendItem
} from './types/index.js';
