---
"@dossierhq/react-components2": minor
---

Make the published display adapter actually work. `PublishedDossierContextAdapter.renderPublishedFieldDisplay()`
was declared but never called: `FieldDisplay` and the rich text `ComponentNode` read their
adapter from `DossierContext`, which isn't provided when an app renders published screens
with only a `PublishedDossierProvider`, so custom field displays were silently ignored.
Both now resolve the adapter through `DisplayModeContext` — `published` mode reads
`PublishedDossierContext`, `full` mode reads `DossierContext`. The rich text `ComponentNode`
likewise resolves its schema through the display mode instead of always requiring the full
schema, which a published-only app can't fetch.

Also add `PublishedDossierContextAdapter.renderPublishedRichTextComponentDisplay()` for
parity with react-components, make `DossierContextAdapter.renderFieldDisplay()` optional
(admin adapters that only override editors no longer need a no-op stub), and export the
theme tokens as `@dossierhq/react-components2/theme.css` so apps with their own Tailwind
pipeline can resolve the same design tokens instead of duplicating them.
