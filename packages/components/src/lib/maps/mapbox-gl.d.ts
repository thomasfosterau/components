/**
 * The minimal `mapbox-gl` surface `DynamicMap` uses, declared here because the
 * package is an OPTIONAL PEER and is deliberately not installed in this
 * repository.
 *
 * Without this file `svelte-check` and `svelte-package` fail on
 * `DynamicMap.svelte`'s two dynamic imports, which would leave us with the
 * choice of taking an 800 kB WebGL dependency on a library that renders a map
 * on no page of its own, or shipping a component nothing type-checks. Neither
 * is acceptable, so the shape is written out instead — it is small, it is the
 * whole of what the component touches, and a change to it is a change a
 * reviewer can see.
 *
 * **It is a build-time stand-in, not a re-publication of Mapbox's types.** A
 * consumer that installs `mapbox-gl` gets the real ones: nothing this package
 * emits references this declaration (the `.d.ts` `svelte-package` copies into
 * `dist/maps/` is reachable only by an explicit `include`), so it cannot shadow
 * them. `mapbox-gl` belongs in the consuming application's dependencies and in
 * this package's `peerDependencies` + `peerDependenciesMeta.optional`.
 *
 * Kept deliberately loose: the goal is to type the six calls `DynamicMap`
 * makes, not to model the library. Anything not listed here is not used.
 */
declare module 'mapbox-gl' {
  /** Only the options `DynamicMap` passes. */
  export interface MapOptions {
    container: HTMLElement;
    accessToken?: string;
    style?: string;
    center?: [number, number];
    zoom?: number;
    bearing?: number;
    pitch?: number;
    scrollZoom?: boolean;
  }

  /** The scroll-zoom handler, which `DynamicMap` turns on and off by touch. */
  export interface ScrollZoomHandler {
    enable(): void;
    disable(): void;
  }

  /** What `map.addControl` accepts; the only one used is {@link NavigationControl}. */
  export interface IControl {
    onAdd(map: Map): HTMLElement;
    onRemove(map: Map): void;
  }

  export class Map {
    constructor(options: MapOptions);
    readonly scrollZoom: ScrollZoomHandler;
    addControl(control: IControl): this;
    on(type: string, listener: (event: unknown) => void): this;
    off(type: string, listener: (event: unknown) => void): this;
    remove(): void;
  }

  export class NavigationControl implements IControl {
    constructor(options?: { showCompass?: boolean; showZoom?: boolean; visualizePitch?: boolean });
    onAdd(map: Map): HTMLElement;
    onRemove(map: Map): void;
  }
}

/**
 * Mapbox GL's stylesheet, imported for its side effect inside `DynamicMap`'s
 * mount effect — the one side-effecting import in a package that claims
 * `sideEffects: false`, and the reason it is inside an effect rather than at
 * the top of a module.
 *
 * `vite/client` already declares `*.css`; this exact specifier is spelled out
 * so the import type-checks with or without that ambient wildcard in scope.
 */
declare module 'mapbox-gl/dist/mapbox-gl.css' {
  const stylesheet: string;
  export default stylesheet;
}
