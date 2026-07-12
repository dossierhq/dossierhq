# Workstream 7: Public API, consumer migration, legacy deprecation

Depends on: runs incrementally alongside all workstreams · Size: M (spread out)

## Goal

Stabilize react-components2's exported API, migrate every consumer, and deprecate the
legacy library.

## Current state

- `src/index.ts` exports 7 symbols: `ContentEditorScreen`, `ContentListScreen`,
  `DossierProvider`, `ThemeProvider`, `useCachingDossierMiddleware`,
  `addContentEditorParamsToURLSearchParams`, `addContentListParamsToURLSearchParams`.
  No types are exported.
- Legacy exports consumers actually use: 6 screens, `DossierProvider`,
  `PublishedDossierProvider`, `DossierContext`, `PublishedDossierContext`,
  `useCachingDossierMiddleware`, and types `DossierContextAdapter`,
  `PublishedDossierContextAdapter`, `FieldEditorProps`, `FieldDisplayProps`,
  `RichTextComponentEditorProps`, `RichTextComponentDisplayProps`, `DisplayAuthKey`.
- Side-by-side consumers already exist: `apps/blog` (`(dossier2)` route group,
  `AppDossierProvider2.tsx`), `examples/astro` (`*2.tsx`), `apps/playground2`.

## Export policy

Export a symbol only once its workstream is functionally complete — don't pre-export
stubs. Target export set at full parity:

- Screens: `ContentListScreen`, `ContentEditorScreen`, `PublishedContentListScreen`,
  `PublishedContentDisplayScreen`, `SchemaEditorScreen`, `ChangelogListScreen`.
- Providers/contexts: `DossierProvider`, `PublishedDossierProvider`, `ThemeProvider`
  (+ contexts if consumers need direct access — blog/playground import the contexts
  today; check what for and export accordingly).
- Hooks: `useCachingDossierMiddleware` (evaluate whether data hooks like `useEntity`
  should go public — legacy kept them internal; default: keep internal).
- URL helpers: all `add*ParamsToURLSearchParams`.
- Types: adapter interfaces + `FieldEditorProps`, `FieldDisplayProps`,
  `RichTextComponentEditorProps`, `RichTextComponentDisplayProps`, `DisplayAuthKey`
  equivalents.

## Tasks

### 1. API hygiene (do early)

- Add type exports as workstreams 1–3 define them; `libraries/cloudinary` is the
  contract test — port its field editor to react-components2 types as soon as
  `FieldEditorProps` exists.
- Decide CSS story for consumers: currently `import '@dossierhq/react-components2/main.css'`.
  Verify the compiled CSS doesn't collide with consumer Tailwind setups (blog uses its
  own Tailwind); document setup per framework (Next.js app router, Astro, Vite SPA).
- Keep `sideEffects: false` honest as lazy-loaded chunks (leaflet, lexical) are added;
  extend `tools/tree-shake-tester` with per-screen import cases.

### 2. Migrate consumers screen-by-screen (as each workstream lands)

Order by feedback value:

1. `apps/playground2` — always tracks HEAD of react-components2 (dev harness).
2. `apps/blog` — replace legacy routes with the `(dossier2)` equivalents as screens reach
   parity; delete the duplicated route group when done.
3. `examples/astro` — same collapse of `*2.tsx` duplicates.
4. `examples/next-web`, `examples/tutorial` — full switch once all 6 screens exist
   (tutorial is documentation-adjacent: update any prose referencing legacy APIs).
5. `apps/playground` — either migrate or retire in favor of `playground2` (decide with
   the strategic-scope question; maintaining two playgrounds long-term is waste).
6. `libraries/cloudinary` — switch peer dep + adapter implementation; may need to
   support both libraries during transition (dual peer deps) since it's published.

### 3. Deprecate legacy

- README notice in `libraries/react-components` + npm `deprecated` field discussion
  (changeset with major/minor bump policy decision).
- Stop dependabot churn: once no app consumes legacy, consider removing it from the
  workspace (git history preserves it) — that alone eliminates a large share of the
  repo's dependency-bump noise (lexical, design-system deps).
- Rename question: `react-components2` as a lasting npm name is awkward. Options:
  keep it, or take over `@dossierhq/react-components` at a new major. Decide before
  writing migration docs for external users; document the outcome in this file.

### 4. Documentation

- Rewrite `libraries/react-components2/README.md` (currently "not yet ready for use")
  with setup + usage per screen once parity milestones land.
- Migration guide for external consumers: legacy import → new import table, adapter
  API changes, CSS setup, dropped/renamed props.

## Acceptance criteria

- All monorepo consumers import only `@dossierhq/react-components2`.
- No `*2` duplicate routes/components remain in blog/astro.
- Legacy package marked deprecated with a pointer to the migration guide.
- Tree-shake tester proves screen-level imports don't drag in leaflet/lexical.
