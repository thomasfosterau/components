/**
 * Coordinate system types for the Pancake-style approach
 * Uses percentage-based coordinates (0-100) that are renderer-agnostic
 */
export interface PancakeCoordinates {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

/**
 * Point in Pancake coordinate space (0-100 scale)
 */
export interface PancakePoint {
	x: number;
	y: number;
}

/**
 * Render target types supported by the library
 */
export type RenderTarget = 'svg' | 'canvas' | 'webgpu';

/**
 * Base interface for all renderers
 */
export interface Renderer {
	readonly type: RenderTarget;
	
	/**
	 * Initialize the renderer with given dimensions
	 */
	initialize(width: number, height: number): void;
	
	/**
	 * Clear the rendering surface
	 */
	clear(): void;
	
	/**
	 * Begin a new path
	 */
	beginPath(): void;
	
	/**
	 * Move to a point (in Pancake coordinates)
	 */
	moveTo(point: PancakePoint): void;
	
	/**
	 * Draw line to a point (in Pancake coordinates)
	 */
	lineTo(point: PancakePoint): void;
	
	/**
	 * Close the current path
	 */
	closePath(): void;
	
	/**
	 * Stroke the current path
	 */
	stroke(color?: string, width?: number): void;
	
	/**
	 * Fill the current path
	 */
	fill(color?: string): void;
	
	/**
	 * Draw a circle (in Pancake coordinates)
	 */
	circle(point: PancakePoint, radius: number, fill?: string, stroke?: string): void;
	
	/**
	 * Draw a rectangle (in Pancake coordinates)
	 */
	rect(coords: PancakeCoordinates, fill?: string, stroke?: string, strokeWidth?: number): void;
	
	/**
	 * Draw text (in Pancake coordinates)
	 */
	text(point: PancakePoint, text: string, options?: TextOptions): void;
	
	/**
	 * Draw an ellipse
	 * @param center - Center point in Pancake coordinates (0-100)
	 * @param radiusX - Horizontal radius in pixels
	 * @param radiusY - Vertical radius in pixels
	 */
	ellipse(center: PancakePoint, radiusX: number, radiusY: number, fill?: string, stroke?: string, strokeWidth?: number): void;
	
	/**
	 * Draw a rounded rectangle
	 * @param coords - Rectangle bounds in Pancake coordinates (0-100)
	 * @param radius - Corner radius in pixels
	 */
	roundedRect(coords: PancakeCoordinates, radius: number, fill?: string, stroke?: string, strokeWidth?: number): void;
	
	/**
	 * Draw a polygon
	 * @param points - Array of points in Pancake coordinates (0-100)
	 */
	polygon(points: PancakePoint[], fill?: string, stroke?: string, strokeWidth?: number): void;
	
	/**
	 * Draw a bezier curve
	 * @param start - Start point in Pancake coordinates (0-100)
	 * @param cp1 - First control point in Pancake coordinates (0-100)
	 * @param cp2 - Second control point in Pancake coordinates (0-100)
	 * @param end - End point in Pancake coordinates (0-100)
	 * @param strokeWidth - Line width in pixels
	 */
	bezierCurve(start: PancakePoint, cp1: PancakePoint, cp2: PancakePoint, end: PancakePoint, stroke?: string, strokeWidth?: number): void;
	
	/**
	 * Draw an arrow from start to end point
	 * @param start - Start point in Pancake coordinates (0-100)
	 * @param end - End point in Pancake coordinates (0-100)
	 * @param strokeWidth - Line width in pixels
	 * @param arrowSize - Arrow head size in pixels
	 */
	arrow(start: PancakePoint, end: PancakePoint, stroke?: string, strokeWidth?: number, arrowSize?: number): void;
	
	/**
	 * Set global alpha/opacity
	 */
	setOpacity(alpha: number): void;
	
	/**
	 * Get the rendering output (SVG string, Canvas element, etc.)
	 */
	getOutput(): unknown;
}

/**
 * Options for text rendering
 */
export interface TextOptions {
	fontSize?: number;
	fontFamily?: string;
	fontWeight?: string | number;
	textAnchor?: 'start' | 'middle' | 'end';
	fill?: string;
	stroke?: string;
	rotation?: number;
}

/**
 * Chart margin configuration
 */
export interface Margin {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

/**
 * Scale types supported
 */
export type ScaleType = 'linear' | 'log' | 'time' | 'band' | 'ordinal' | 'point' | 'sqrt' | 'pow';

/**
 * Base scale interface
 */
export interface Scale<Domain = unknown, Range = unknown> {
	type: ScaleType;
	domain(domain?: Domain[]): Domain[] | this;
	range(range?: Range[]): Range[] | this;
	(value: Domain): Range | undefined;
}

/**
 * Data point for charts
 */
export interface DataPoint {
	[key: string]: unknown;
}

/**
 * Axis configuration
 */
export interface AxisConfig {
	type?: 'x' | 'y';
	position?: 'top' | 'bottom' | 'left' | 'right';
	label?: string;
	tickCount?: number;
	tickFormat?: (value: unknown) => string;
	gridLines?: boolean;
}

/**
 * Theme configuration
 */
export interface Theme {
	colors: {
		primary: string;
		secondary: string;
		background: string;
		text: string;
		grid: string;
		axis: string;
	};
	fonts: {
		family: string;
		size: {
			small: number;
			medium: number;
			large: number;
		};
	};
	stroke: {
		width: number;
	};
}

/**
 * Chart animation options
 */
export interface AnimationOptions {
	duration?: number;
	easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
	delay?: number;
}

/**
 * Tooltip configuration
 */
export interface TooltipConfig {
	enabled?: boolean;
	formatter?: (data: DataPoint) => string;
}

/**
 * Legend configuration
 */
export interface LegendConfig {
	enabled?: boolean;
	position?: 'top' | 'bottom' | 'left' | 'right';
	items?: LegendItem[];
}

export interface LegendItem {
	label: string;
	color: string;
	shape?: 'circle' | 'square' | 'line';
}
