/**
 * The tip stack: which tips are on screen, most recent last.
 *
 * It exists for one keystroke. Escape must close the tip the reader is looking
 * at — the last one to appear — and not every tip on the page at once. Each
 * visible tip asks the stack whether it is on top before acting on the key.
 *
 * @module
 */

export interface TipStack {
  /** Mark a tip visible, moving it to the top if it was already there. */
  push: (id: string) => void;
  /** Mark a tip no longer visible. */
  pop: (id: string) => void;
  /** Whether this tip is the one Escape should close. */
  isTopmost: (id: string) => boolean;
}

/**
 * A fresh stack. Create one per app (or per test) and hand it to the tips; a
 * module-level singleton would make two mounted apps — or two tests — share a
 * stack, which is exactly the bug this is meant to prevent.
 */
export const createTipStack = (): TipStack => {
  const stack: string[] = [];
  return {
    push: (id) => {
      const index = stack.indexOf(id);
      if (index !== -1) stack.splice(index, 1);
      stack.push(id);
    },
    pop: (id) => {
      const index = stack.indexOf(id);
      if (index !== -1) stack.splice(index, 1);
    },
    isTopmost: (id) => stack.length > 0 && stack[stack.length - 1] === id,
  };
};

/** A stack that always says yes — for a tip mounted without one. */
export const soloTipStack: TipStack = {
  push: () => {},
  pop: () => {},
  isTopmost: () => true,
};
