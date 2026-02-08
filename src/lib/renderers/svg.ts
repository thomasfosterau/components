import type {
	Renderer,
	PancakePoint,
	PancakeCoordinates,
	TextOptions
} from '../types/index.js';
import { pancakeToPixels, pancakePointToPixels, pancakeCoordsToPixels } from '../utils/index.js';

/**
 * SVG Renderer - generates SVG markup for SSR compatibility
 */
export class SVGRenderer implements Renderer {
	readonly type = 'svg' as const;
	private width: number = 0;
	private height: number = 0;
	private elements: string[] = [];
	private currentPath: string = '';
	private opacity: number = 1;

	initialize(width: number, height: number): void {
		this.width = width;
		this.height = height;
		this.elements = [];
	}

	clear(): void {
		this.elements = [];
		this.currentPath = '';
	}

	beginPath(): void {
		this.currentPath = '';
	}

	moveTo(point: PancakePoint): void {
		const { x, y } = pancakePointToPixels(point, this.width, this.height);
		this.currentPath += `M ${x} ${y} `;
	}

	lineTo(point: PancakePoint): void {
		const { x, y } = pancakePointToPixels(point, this.width, this.height);
		this.currentPath += `L ${x} ${y} `;
	}

	closePath(): void {
		this.currentPath += 'Z';
	}

	stroke(color: string = '#000000', width: number = 1): void {
		if (this.currentPath) {
			this.elements.push(
				`<path d="${this.currentPath}" fill="none" stroke="${color}" stroke-width="${width}" opacity="${this.opacity}" />`
			);
			this.currentPath = '';
		}
	}

	fill(color: string = '#000000'): void {
		if (this.currentPath) {
			this.elements.push(
				`<path d="${this.currentPath}" fill="${color}" opacity="${this.opacity}" />`
			);
			this.currentPath = '';
		}
	}

	circle(point: PancakePoint, radius: number, fill?: string, stroke?: string): void {
		const { x, y } = pancakePointToPixels(point, this.width, this.height);
		const attrs: string[] = [];
		
		if (fill) attrs.push(`fill="${fill}"`);
		else attrs.push('fill="none"');
		
		if (stroke) attrs.push(`stroke="${stroke}"`);
		attrs.push(`opacity="${this.opacity}"`);
		
		this.elements.push(
			`<circle cx="${x}" cy="${y}" r="${radius}" ${attrs.join(' ')} />`
		);
	}

	rect(coords: PancakeCoordinates, fill?: string, stroke?: string): void {
		const { x1, y1, x2, y2 } = pancakeCoordsToPixels(coords, this.width, this.height);
		const width = Math.abs(x2 - x1);
		const height = Math.abs(y2 - y1);
		const x = Math.min(x1, x2);
		const y = Math.min(y1, y2);
		
		const attrs: string[] = [];
		if (fill) attrs.push(`fill="${fill}"`);
		else attrs.push('fill="none"');
		if (stroke) attrs.push(`stroke="${stroke}"`);
		attrs.push(`opacity="${this.opacity}"`);
		
		this.elements.push(
			`<rect x="${x}" y="${y}" width="${width}" height="${height}" ${attrs.join(' ')} />`
		);
	}

	text(point: PancakePoint, text: string, options: TextOptions = {}): void {
		const { x, y } = pancakePointToPixels(point, this.width, this.height);
		const {
			fontSize = 12,
			fontFamily = 'sans-serif',
			fontWeight,
			textAnchor = 'start',
			fill = '#000000',
			stroke,
			rotation
		} = options;
		
		const attrs: string[] = [
			`x="${x}"`,
			`y="${y}"`,
			`font-size="${fontSize}"`,
			`font-family="${fontFamily}"`,
			`text-anchor="${textAnchor}"`,
			`fill="${fill}"`,
			`opacity="${this.opacity}"`
		];
		
		if (fontWeight) attrs.push(`font-weight="${fontWeight}"`);
		if (stroke) attrs.push(`stroke="${stroke}"`);
		if (rotation) attrs.push(`transform="rotate(${rotation} ${x} ${y})"`);
		
		this.elements.push(`<text ${attrs.join(' ')}>${text}</text>`);
	}

	setOpacity(alpha: number): void {
		this.opacity = Math.max(0, Math.min(1, alpha));
	}

	getOutput(): string {
		return `<svg width="${this.width}" height="${this.height}" xmlns="http://www.w3.org/2000/svg">${this.elements.join('')}</svg>`;
	}
}
