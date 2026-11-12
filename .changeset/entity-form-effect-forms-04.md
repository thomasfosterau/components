---
'@thomasfosterau/components': minor
---

**Breaking (`/entity-form`):** `EntityForm` now renders `@thomasfosterau/effect-forms-svelte` 0.4 definitions, and the optional peer moves from `^0.3.1` to `^0.4.0`. effect-forms-svelte 0.4 addresses fields by typed focus instead of string path, so no 0.3 release fits. A consumer of `/entity-form` must:

- upgrade `@thomasfosterau/effect-forms-svelte` to `^0.4.0`;
- install that release's new required peer, `@thomasfosterau/effect-ext` `^0.1.0 || ^0.2.0` (its 0.3 line is outside the form library's range);
- run Node 22.18 or later, which effect-forms-svelte 0.4 requires.

Consumers that never import `/entity-form` are unaffected. The `svelte` (`^5.40.0`) and `effect` (`^4.0.0`) peer ranges are unchanged.

`EntityForm`'s props are unchanged, but two of their types follow the form library:

- `enhance` receives a 0.4 `FormStore` over the definition's all-string input record (`Readonly<Record<string, string | undefined>>`), validated by the mode's `createInput` / `updateInput`. It must return that store's `FormProps`. A custom `enhance` that reads the store uses the 0.4 names: `isPosted` / `isValid` for `posted` / `valid`, `formErrors` for the root messages, and a focus (`form.root.key('title')`) for `errorsAt` / `get` / `set`. `/kit`'s `enhanceForm` can be passed directly.
- `fieldProps[key]` is typed as the form library's `WidgetOwnProps`: a widget's own props, partial, without the renderer-owned bridge keys. As before, `name`, `value`, `onChange` and `errors` given there are overridden by the bridge.

What `EntityForm` renders is unchanged: the controls, their names and ids, the error summary and the save bar.
