/**
 * The consent seam: which categories an app asks about, the reader's choice,
 * and `hasConsent` for anything that must wait for it. Storage is the
 * caller's (`read`/`write`); `cookieStorage` is a convenience that touches
 * `document.cookie` only when called.
 *
 * @module
 */

import { getContext, setContext } from 'svelte';

/** One kind of cookie or third-party content the app asks about. */
export interface ConsentCategory {
  /** Stable key in the stored choice: `'analytics'`. */
  readonly id: string;
  /** Shown in `ConsentSettings`: "Analytics cookies". */
  readonly label: string;
  /** What the category is for, under its label. */
  readonly description?: string | undefined;
  /** Strictly necessary: always on, and its switch disabled. */
  readonly required?: boolean | undefined;
}

/** Whether each category is allowed, by `id`. */
export type ConsentChoice = Readonly<Record<string, boolean>>;

/** What `createConsent` needs. */
export interface ConsentOptions {
  readonly categories: readonly ConsentCategory[];
  /** The stored choice, or `undefined` when the reader has not chosen. Called once, on creation. */
  readonly read?: (() => ConsentChoice | undefined) | undefined;
  /** Store a choice, or clear it (`undefined`) after `reset`. */
  readonly write?: ((choice: ConsentChoice | undefined) => void) | undefined;
}

/** One category's state in the shape `Embed`'s `consent` prop takes. */
export interface CategoryConsent {
  readonly granted: boolean;
  readonly grant: () => void;
}

/** What `getConsent()` returns. */
export interface ConsentApi {
  readonly categories: readonly ConsentCategory[];
  /** The reader's choice, or `undefined` until they make one. */
  readonly choice: ConsentChoice | undefined;
  /** Whether `id` is allowed: a required category always is; anything else only once chosen. */
  hasConsent(id: string): boolean;
  /** Record a choice; required categories are forced on, and missing ones off. */
  set(choice: ConsentChoice): void;
  /** Allow every category. */
  acceptAll(): void;
  /** Allow only the required categories. */
  rejectAll(): void;
  /** Allow one more category, keeping the rest of the choice. */
  grant(id: string): void;
  /** Forget the choice, so the banner asks again. */
  reset(): void;
  /** One category, live, for `<Embed consent={consent.category('video')}>`. */
  category(id: string): CategoryConsent;
}

class ConsentStore implements ConsentApi {
  readonly categories: readonly ConsentCategory[];
  readonly #write: ((choice: ConsentChoice | undefined) => void) | undefined;
  #choice: ConsentChoice | undefined = $state(undefined);

  constructor(options: ConsentOptions) {
    this.categories = options.categories;
    this.#write = options.write;
    const stored = options.read?.();
    this.#choice = stored === undefined ? undefined : this.#normalise(stored);
  }

  get choice(): ConsentChoice | undefined {
    return this.#choice;
  }

  #normalise(choice: ConsentChoice): ConsentChoice {
    return Object.fromEntries(
      this.categories.map((category) => [
        category.id,
        category.required === true || choice[category.id] === true,
      ]),
    );
  }

  hasConsent(id: string): boolean {
    const category = this.categories.find((entry) => entry.id === id);
    if (category?.required === true) return true;
    return this.#choice?.[id] === true;
  }

  set(choice: ConsentChoice): void {
    this.#choice = this.#normalise(choice);
    this.#write?.(this.#choice);
  }

  acceptAll(): void {
    this.set(Object.fromEntries(this.categories.map((category) => [category.id, true])));
  }

  rejectAll(): void {
    this.set({});
  }

  grant(id: string): void {
    this.set({ ...this.#choice, [id]: true });
  }

  reset(): void {
    this.#choice = undefined;
    this.#write?.(undefined);
  }

  category(id: string): CategoryConsent {
    const granted = (): boolean => this.hasConsent(id);
    return {
      get granted() {
        return granted();
      },
      grant: () => this.grant(id),
    };
  }
}

/** A consent store over `categories`, reading and writing through the caller's storage. */
export const createConsent = (options: ConsentOptions): ConsentApi => new ConsentStore(options);

const CONSENT_KEY = Symbol('@thomasfosterau/components:consent');

/** Publish a store to the component tree below and return it. Call once, in the root layout. */
export function setConsent(api: ConsentApi): ConsentApi {
  return setContext(CONSENT_KEY, api);
}

/** The store `setConsent` published. Throws when there is none. */
export function getConsent(): ConsentApi {
  const api = getContext<ConsentApi | undefined>(CONSENT_KEY);
  if (api === undefined) throw new Error('getConsent() was called before setConsent()');
  return api;
}

/** The `read` and `write` pair `cookieStorage` returns, to spread into `createConsent`'s options. */
export interface ConsentStorage {
  readonly read: () => ConsentChoice | undefined;
  readonly write: (choice: ConsentChoice | undefined) => void;
}

/** Options for {@link cookieStorage}. */
export interface CookieStorageOptions {
  /** @defaultValue `365` */
  readonly maxAgeDays?: number | undefined;
  /** @defaultValue `'/'` */
  readonly path?: string | undefined;
}

const isChoice = (value: unknown): value is ConsentChoice =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((entry) => typeof entry === 'boolean');

/** Parse a stored choice, or `undefined` for anything that is not one. */
export const parseConsentChoice = (raw: string | undefined): ConsentChoice | undefined => {
  if (raw === undefined || raw === '') return undefined;
  try {
    const value: unknown = JSON.parse(decodeURIComponent(raw));
    return isChoice(value) ? value : undefined;
  } catch {
    return undefined;
  }
};

/**
 * `read` and `write` over a first-party cookie (`SameSite=Lax`, `Secure` on
 * https). Both do nothing on the server; read the cookie there yourself and
 * pass it through `parseConsentChoice` to render the right state first time.
 */
export const cookieStorage = (
  name: string,
  { maxAgeDays = 365, path = '/' }: CookieStorageOptions = {},
): ConsentStorage => ({
  read: () => {
    if (typeof document === 'undefined') return undefined;
    const prefix = `${encodeURIComponent(name)}=`;
    const entry = document.cookie.split('; ').find((part) => part.startsWith(prefix));
    return parseConsentChoice(entry?.slice(prefix.length));
  },
  write: (choice) => {
    if (typeof document === 'undefined') return;
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    const value = choice === undefined ? '' : encodeURIComponent(JSON.stringify(choice));
    const maxAge = choice === undefined ? 0 : Math.round(maxAgeDays * 86_400);
    document.cookie = `${encodeURIComponent(name)}=${value}; Max-Age=${maxAge}; Path=${path}; SameSite=Lax${secure}`;
  },
});
