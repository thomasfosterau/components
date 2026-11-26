---
'@thomasfosterau/components-import': minor
---

`ImportFormat` takes an optional reader factory, `readerWith`, such as `{ ...Csv.format, readerWith: Csv.makeCsvReader }`. For a format with one, `ImportReadOptions` offers the text encoding (detected by default), the separator (the format's own, comma, semicolon or tab), the quote, ragged rows (on by default) and type inference, and previews each change on a bounded read of `previewRows` records (`ImportMapper`'s new `previewRows`, 200 by default). Going on reads the whole file with them, and `result.spec.source` records the `encoding` and `readerOptions`. A format without a factory reads as before. A failed read now shows the reader's reason rather than an empty one.

`ImportReadOptions` takes `source`, a bindable `reader` and copy for the new controls; `ImportMapper` takes `readFailedMessage` and `noTableMessage`; `ImportFile` gains `reader` and `encoding`. New exports from `./svelte`: `defaultReaderChoice` and the types `ImportReader`, `ImportReaderOptions`, `ImportDialect`, `ReaderChoice`, `SeparatorChoice` and `QuoteChoice`.
