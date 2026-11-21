<!-- @component
`SignaturePad`'s drawing area with Undo and Clear: SVG strokes from pointer input, with a pen's stroke ignoring touches. Internal.
-->
<script lang="ts">
  import { padHeight, strokePath, type SignaturePoint, type SignatureStroke } from './signature.ts';

  interface Props {
    /** The finished strokes. Bindable. */
    strokes: readonly SignatureStroke[];
    aspect: number;
    strokeWidth: number;
    padLabel: string;
    /** Ids for the pad's `aria-describedby`. */
    describedBy: string;
    undoLabel: string;
    clearLabel: string;
    disabled: boolean;
    /** Called after a stroke is added or removed. */
    onChange: (strokes: readonly SignatureStroke[]) => void;
  }

  let {
    strokes = $bindable(),
    aspect,
    strokeWidth,
    padLabel,
    describedBy,
    undoLabel,
    clearLabel,
    disabled,
    onChange,
  }: Props = $props();

  const width = $derived(aspect * padHeight);
  let live: SignaturePoint[] = $state([]);
  let pointerId: number | undefined;

  const pointAt = (event: PointerEvent, pad: SVGSVGElement): SignaturePoint => {
    const rect = pad.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * width,
      y: ((event.clientY - rect.top) / rect.height) * padHeight,
    };
  };

  const set = (next: readonly SignatureStroke[]): void => {
    strokes = next;
    onChange(next);
  };

  const onpointerdown = (event: PointerEvent & { currentTarget: SVGSVGElement }): void => {
    // One stroke at a time, which is also palm rejection: a touch while a
    // pen is drawing is the hand resting on the screen.
    if (disabled || event.button !== 0 || pointerId !== undefined) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerId = event.pointerId;
    live = [pointAt(event, event.currentTarget)];
  };

  const onpointermove = (event: PointerEvent & { currentTarget: SVGSVGElement }): void => {
    if (event.pointerId !== pointerId) return;
    const pad = event.currentTarget;
    const events = event.getCoalescedEvents?.() ?? [];
    const points = (events.length > 0 ? events : [event]).map((each) => pointAt(each, pad));
    live = [...live, ...points];
  };

  const finish = (event: PointerEvent): void => {
    if (event.pointerId !== pointerId) return;
    pointerId = undefined;
    const stroke = live;
    live = [];
    if (stroke.length > 0) set([...strokes, stroke]);
  };
</script>

<div class="flex flex-col gap-2">
  <svg
    role="img"
    aria-label={padLabel}
    aria-describedby={describedBy}
    viewBox="0 0 {width} {padHeight}"
    class={[
      'rounded-box border-base-300 bg-base-100 text-base-content block w-full border',
      disabled ? 'opacity-50' : 'cursor-crosshair',
    ]}
    style:aspect-ratio="{aspect} / 1"
    style:touch-action="none"
    {onpointerdown}
    {onpointermove}
    onpointerup={finish}
    onpointercancel={finish}
  >
    {#each [...strokes, live] as stroke, index (index)}
      <path
        d={strokePath(stroke)}
        fill="none"
        stroke="currentColor"
        stroke-width={strokeWidth}
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    {/each}
  </svg>
  <div class="flex justify-end gap-2">
    <button
      type="button"
      class="btn btn-ghost btn-sm"
      disabled={disabled || strokes.length === 0}
      onclick={() => {
        set(strokes.slice(0, -1));
      }}
    >
      {undoLabel}
    </button>
    <button
      type="button"
      class="btn btn-ghost btn-sm"
      disabled={disabled || strokes.length === 0}
      onclick={() => {
        set([]);
      }}
    >
      {clearLabel}
    </button>
  </div>
</div>
