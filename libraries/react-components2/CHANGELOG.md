# Change Log - @dossierhq/react-components2

## 0.8.0

### Minor Changes

- 8a41956: Make the published display adapter actually work. `PublishedDossierContextAdapter.renderPublishedFieldDisplay()`
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
- 39e0c82: Add optional `header`/`footer` props to all screens (`ContentListScreen`,
  `ContentEditorScreen`, `PublishedContentListScreen`, `PublishedContentDisplayScreen`,
  `SchemaEditorScreen`, `ChangelogListScreen`), for parity with react-components. Consumers
  can use them to render app chrome such as a navigation bar around a screen, since screens
  occupy the full viewport. Also export the props type of every screen, plus `ScreenChromeProps`.
- 7f88c81: Bring react-components2 to feature parity with react-components: all field types
  (boolean, number, string incl. enums, location, reference, component, rich text)
  in editor and display, entity name/auth key/publishing lifecycle/entity links in
  the content editor, drag-and-drop list reordering, adapter extension points for
  custom field and rich text component rendering, published (read-only) mode with
  PublishedDossierProvider and PublishedContentListScreen/PublishedContentDisplayScreen,
  SchemaEditorScreen, and ChangelogListScreen.

### Patch Changes

- @dossierhq/core@0.8.0
  - @dossierhq/leaflet@0.8.0

This log was last generated on Sun, 09 Feb 2025 13:11:00 GMT and should not be manually modified.

## 0.7.12
Sun, 09 Feb 2025 13:11:00 GMT

_Version update only_

## 0.7.11
Sun, 09 Feb 2025 12:55:36 GMT

_Version update only_

## 0.7.10
Sun, 15 Dec 2024 11:40:33 GMT

### Updates

- React 19

## 0.7.9
Sun, 24 Nov 2024 13:36:03 GMT

### Updates

- Make tailwind-animate a dev dependency

## 0.7.8
Fri, 02 Aug 2024 14:47:04 GMT

### Updates

- First release

