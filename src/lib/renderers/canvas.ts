import type {
	Renderer,
	PancakePoint,
	PancakeCoordinates,
	TextOptions
} from '../types/index.js';
import { pancakePointToPixels, pancakeCoordsToPixels } from '../utils/index.js';

/**
 * Canvas Renderer - uses HTML5 Canvas API for high-performance rendering
 */
export class CanvasRenderer implements Renderer {
	readonly type = 'canvas' as const;
	private width: number = 0;
	private height: number = 0;
	private context: CanvasRenderingContext2D | null = null;
	private canvas: HTMLCanvasElement | null = null;

	constructor(canvas?: HTMLCanvasElement) {
		if (canvas) {
			this.canvas = canvas;
			this.context = canvas.getContext('2d');
		}
	}

	initialize(width: number, height: number): void {
		this.width = width;
		this.height = height;
		
		if (!this.canvas) {
			this.canvas = document.createElement('canvas');
			this.context = this.canvas.getContext('2d');
		}
		
		if (this.canvas) {
			this.canvas.width = width;
			this.canvas.height = height;
		}
	}

	clear(): void {
		if (this.context && this.canvas) {
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		}
	}

	beginPath(): void {
		this.context?.beginPath();
	}

	moveTo(point: PancakePoint): void {
		if (!this.context) return;
		const { x, y } = pancakePointToPixels(point, this.width, this.height);
		this.context.moveTo(x, y);
	}

	lineTo(point: PancakePoint): void {
		if (!this.context) return;
		const { x, y } = pancakePointToPixels(point, this.width, this.height);
		this.context.lineTo(x, y);
	}

	closePath(): void {
		this.context?.closePath();
	}

	stroke(color: string = '#000000', width: number = 1): void {
		if (!this.context) return;
		this.context.strokeStyle = color;
		this.context.lineWidth = width;
		this.context.stroke();
	}

	fill(color: string = '#000000'): void {
		if (!this.context) return;
		this.context.fillStyle = color;
		this.context.fill();
	}

	circle(point: PancakePoint, radius: number, fill?: string, stroke?: string): void {
		if (!this.context) return;
		const { x, y } = pancakePointToPixels(point, this.width, this.height);
		
		this.context.beginPath();
		this.context.arc(x, y, radius, 0, Math.PI * 2);
		
		if (fill) {
			this.context.fillStyle = fill;
			this.context.fill();
		}
		
		if (stroke) {
			this.context.strokeStyle = stroke;
			this.context.stroke();
		}
	}

	rect(coords: PancakeCoordinates, fill?: string, stroke?: string): void {
		if (!this.context) return;
		const { x1, y1, x2, y2 } = pancakeCoordsToPixels(coords, this.width, this.height);
		const width = Math.abs(x2 - x1);
		const height = Math.abs(y2 - y1);
		const x = Math.min(x1, x2);
		const y = Math.min(y1, y2);
		
		if (fill) {
			this.context.fillStyle = fill;
			this.context.fillRect(x, y, width, height);
		}
		
		if (stroke) {
			this.context.strokeStyle = stroke;
			this.context.strokeRect(x, y, width, height);
		}
	}

	text(point: PancakePoint, text: string, options: TextOptions = {}): void {
		if (!this.context) return;
		const { x, y } = pancakePointToPixels(point, this.width, this.height);
		const {
			fontSize = 12,
			fontFamily = 'sans-serif',
			fontWeight = 'normal',
			textAnchor = 'start',
			fill = '#000000',
			stroke,
			rotation
		} = options;
		
		this.context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
		this.context.textAlign = textAnchor === 'middle' ? 'center' : textAnchor === 'end' ? 'right' : 'left';
		
		if (rotation) {
			this.context.save();
			this.context.translate(x, y);
			this.context.rotate((rotation * Math.PI) / 180);
			
			if (fill) {
				this.context.fillStyle = fill;
				this.context.fillText(text, 0, 0);
			}
			
			if (stroke) {
				this.context.strokeStyle = stroke;
				this.context.strokeText(text, 0, 0);
			}
			
			this.context.restore();
		} else {
			if (fill) {
				this.context.fillStyle = fill;
				this.context.fillText(text, x, y);
			}
			
			if (stroke) {
				this.context.strokeStyle = stroke;
				this.context.strokeText(text, x, y);
			}
		}
	}

	setOpacity(alpha: number): void {
		if (this.context) {
			this.context.globalAlpha = Math.max(0, Math.min(1, alpha));
		}
	}

	getOutput(): HTMLCanvasElement | null {
		return this.canvas;
	}
}
