/**
 * The colour-token indirection: how a component takes a colour it does not
 * own.
 *
 * Some things are coloured by their subject rather than by a semantic tone —
 * a political party, a taxon rank, a project label. The colour belongs to the
 * consuming application, not to this library, and it is never an inline hex
 * here: the app's theme declares one custom property per subject
 * (`--party-alp`, `--rank-genus`, …) in **both** its light and dark themes,
 * and hands a component the property's NAME.
 *
 * The helpers below turn that name into the single custom property the
 * component's Tailwind classes read (`bg-(--badge-colour)`,
 * `border-(--chip-colour)`), with the theme's `neutral` colour as the
 * fallback for a token the theme has no entry for. The only inline style
 * any component in this package emits is that one variable indirection —
 * the colour value itself stays in the stylesheet.
 *
 * @module
 */

/** The custom property {@link Badge} binds a `colourToken` to. */
export const BADGE_COLOUR_PROPERTY = '--badge-colour';

/** The custom property {@link Chip} binds a `colourToken` to. */
export const CHIP_COLOUR_PROPERTY = '--chip-colour';

/** A valid CSS custom-property name: `--` then idents, and nothing else. */
const CUSTOM_PROPERTY = /^--[a-z0-9_-]+$/i;

/**
 * The inline `style` binding `property` to the theme token `token`, falling
 * back to `--color-neutral` when the theme declares no such token.
 *
 * `token` is validated rather than trusted: a value that is not a custom
 * property name is dropped entirely, so nothing a caller passes can break out
 * of the `var()` it is interpolated into and inject further declarations.
 *
 * Returns `undefined` when there is no token, so a component can hand the
 * result straight to `style` and emit no attribute at all.
 *
 * ```svelte
 * <span style={colourTokenStyle(BADGE_COLOUR_PROPERTY, '--party-alp')}
 *       class="bg-(--badge-colour)/15 border-(--badge-colour)">…</span>
 * ```
 */
export function colourTokenStyle(property: string, token: string | undefined): string | undefined {
  if (token === undefined) return undefined;
  const name = token.trim();
  const safe = CUSTOM_PROPERTY.test(name) ? name : '--color-neutral';
  return `${property}: var(${safe}, var(--color-neutral))`;
}
