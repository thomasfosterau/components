---
'@thomasfosterau/components': minor
---

`DescriptionList` gains a `bare` variant: the `<dl>` takes only the caller's `class` and every `DescriptionRow`'s `<dt>`/`<dd>` is a direct child of it, so a consumer-owned grid (`grid-cols-[auto_1fr]`, say) can hold `DescriptionRow`s beside its own `<dt>`/`<dd>` pairs without a wrapper breaking its columns. `DescriptionListStyle['variant']` widens to include `'bare'`.
