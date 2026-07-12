# `@dossierhq/react-components2`

React components for creating a headless CMS using Dossier.

This package replaces `@dossierhq/react-components` with a Tailwind/shadcn-based
implementation. It provides:

- `ContentListScreen` / `ContentEditorScreen` — browse, search (list/split/map view) and edit
  content with support for all field types including rich text
- `PublishedContentListScreen` / `PublishedContentDisplayScreen` — read-only views of published
  content (requires `PublishedDossierProvider`)
- `SchemaEditorScreen` — edit entity types, component types, indexes and patterns
- `ChangelogListScreen` — browse the changelog of all events
- `DossierProvider` / `PublishedDossierProvider` — provide clients, auth keys and adapters
  (custom field editors/displays and rich text component rendering)

Include the stylesheet in your app:

```ts
import '@dossierhq/react-components2/main.css';
```

`@dossierhq/react-components2` is part of [Dossier](https://www.dossierhq.dev/), a toolkit for building headless CMSs.

- [Changelog](./CHANGELOG.md)
