# Workstream 4: Published (read-only) mode

Depends on: 1 (field display), 3 (rich-text display) · Size: M

## Goal

React-components2 equivalents of `PublishedDossierProvider`,
`PublishedContentListScreen`, and `PublishedContentDisplayScreen`, so apps can browse
and inspect published content with a published-only client.

## Current state

Infrastructure is half-present by design:

- `ContentListReducer` fully type-models `mode: 'full' | 'published'` (separate query
  types, `PublishedEntityQueryOrder`, default orders) — but both screens hardcode `'full'`.
- `ContentMap` is generic over `PublishedEntity`/`PublishedSchema`.
- `DossierProvider` only accepts a full `DossierClient`; hooks (`useEntity`,
  `useEntities`, …) only call the full client. No published screens exist.

## Legacy reference

`PublishedDossierProvider`, `PublishedDossierContext` (+
`PublishedDossierContextAdapter`), `screens/PublishedContentListScreen.tsx`,
`screens/PublishedContentDisplayScreen.tsx`, `EntityDisplayReducer` (+ URL synchronizer),
published hook family (`usePublishedEntity`, `usePublishedEntities`,
`usePublishedEntitiesSample`, `usePublishedEntitiesTotalCount`, `usePublishedSchema`,
`usePublishedLoadEntitySearch`), `PublishedEntityList/MapMarker/SearchToolbar/
SelectorDialog`, `PublishedLocationDisplayDialog`.

## Design decision

Legacy duplicated the whole surface with `Published*` components. React-components2's
reducers instead parameterize on `mode`. Continue that: **one component tree, mode-aware
contexts**, published-specific code only where behavior genuinely differs (no status
filter, no create/edit affordances, different client type). Expect roughly:

- `DossierProvider` gains a sibling `PublishedDossierProvider` (separate context — the
  client types are disjoint and apps may mount both, as blog/astro do today).
- Hooks get published variants (`usePublishedEntity`, etc.) or a mode-generic core with
  thin typed wrappers — pick whichever keeps SWR cache keys distinct (legacy prefixed
  cache keys; `CacheUtils.ts` already exists, extend it).
- `useCachingDossierMiddleware` already exists for the full client; check legacy's
  published caching behavior and mirror if needed.

## Tasks

1. **PublishedDossierContext/Provider** — client + logger + adapter
   (`renderFieldDisplay`, `renderRichTextComponentDisplay` published variants; extends
   workstream 2/3 adapter design).
2. **Published hooks** — the six hooks above, SWR-keyed distinctly from full-client keys.
3. **PublishedContentListScreen** — reuse `ContentListScreen` internals with
   `mode: 'published'`: no status selector, no create button, published order dropdown;
   URL sync (`ContentListUrlSynchronizer` already handles published query shapes — verify
   and test); list/split/map view modes work as-is via generics.
4. **Published display screen** — legacy `PublishedContentDisplayScreen` is a multi-entity
   read-only analog of the editor: open multiple entities (`entityIds[]` in URL),
   sidebar menu, entity links (to/from), invalid-entity badge. Build as
   `PublishedContentDisplayScreen` reusing `EntityDisplay`/`EntityFieldDisplay`
   (exist) + a new small `ContentDisplayReducer` + URL synchronizer (port legacy
   `EntityDisplayReducer` — it's tiny: AddEntity/RemoveEntity/SetActiveEntity).
   Include a command menu for open/close, consistent with the editor screen.
5. **Published dialogs** — read-only location dialog (from workstream 1), published
   entity picker (reuse open-content dialog in published mode).
6. **Click-through wiring** — reference displays and rich-text entity links open entities
   via an `onOpenEntity` callback prop on the display screen (legacy did this via screen
   wiring; keep the same prop-driven approach as `ContentListScreen`).

## Testing & stories

- Stories for both published screens against `StoryDossierProvider` (needs a published
  client from the sql.js server — check `@dossierhq/test-data` provides published
  entities; publish some in the story setup if not).
- Reducer test for `ContentDisplayReducer` + URL round-trip.
- Story asserting no edit affordances leak into published mode (Chromatic).

## Acceptance criteria

- Blog/astro's published routes can switch to react-components2 published screens.
- Published list supports search, sampling, paging, map, type filter — but no status
  filter or create.
- Multi-entity display with URL sync and working entity-link navigation.
