# Plan: Bring `react-components2` to parity with `react-components`

Status: proposed · Last updated: 2026-07-12

## Goal

Make `@dossierhq/react-components2` (shadcn/Tailwind rewrite) a full replacement for
`@dossierhq/react-components` (legacy, `@dossierhq/design`-based), so that all current
consumers (`apps/playground`, `apps/blog`, `examples/next-web`, `examples/tutorial`,
`examples/astro`, `libraries/cloudinary`) can migrate and the legacy library can be
deprecated.

## Current state (2026-07-12)

| Area                         | Legacy `react-components`                                                                                                              | `react-components2`                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Screens                      | 6 (ContentList, ContentEditor, PublishedContentList, PublishedContentDisplay, SchemaEditor, ChangelogList)                             | 2 (ContentList, ContentEditor, admin-only)                                              |
| Field types (edit + display) | Boolean, Number, String (+enum), Location, Reference, RichText, Component — single + list                                              | String single + list only; everything else renders "not supported"                      |
| Rich text                    | Full Lexical editor + read-only display, entity/entity-link/component nodes, code highlight, toolbar                                   | None (no lexical dependency)                                                            |
| Published (read-only) mode   | Full parallel surface (provider, context, screens, dialogs, hooks)                                                                     | Reducer type-models `'published'` but nothing is wired; screens hardcode `mode: 'full'` |
| Schema editor                | Full (types, fields, indexes, patterns, drag-and-drop reorder, save dialog)                                                            | None                                                                                    |
| Changelog / entity history   | ChangelogListScreen + AdminEntityHistoryDialog with version diff                                                                       | None                                                                                    |
| Entity editor extras         | Name input, AuthKeyPicker, PublishingButton (publish/unpublish/archive/unarchive/delete), entity links                                 | Name/auth-key/publishing stubbed out (commented in `EntityEditor.tsx:34–108`)           |
| Extension points             | `DossierContextAdapter` (`renderFieldEditor`, `renderRichTextComponentEditor`) + published equivalents; used by `libraries/cloudinary` | None (TODO comments in `FieldEditor.tsx:29`, `FieldDisplay.tsx:24`)                     |
| Public exports               | 6 screens, 2 providers, 2 contexts, 1 hook, 7 types                                                                                    | 7 symbols total, no types exported                                                      |

Both libraries currently receive only dependency bumps — no active feature work — so this
plan restarts feature development on react-components2.

## Strategic caveat (read first)

`docs/postmortem/generic-admin-ui-vs-ai-agents.md` (stub) questions whether the generic
admin UI investment is still worthwhile in a world of AI-generated bespoke UIs. Before
executing the full plan, decide scope explicitly:

- **Full parity** — execute all workstreams below; legacy can be deleted.
- **Editing parity only** (recommended minimum) — workstreams 1–4; keep legacy around for
  SchemaEditorScreen/ChangelogListScreen or drop those features.
- **Freeze** — pause both; not covered further here.

The workstreams are ordered so that stopping after any of them still leaves a coherent,
shippable library.

## Workstreams

| #   | Plan                                                         | Depends on                  | Size | Outcome                                                        |
| --- | ------------------------------------------------------------ | --------------------------- | ---- | -------------------------------------------------------------- |
| 1   | [Field editors & display](./01-field-editors-and-display.md) | —                           | M    | All non-rich-text field types editable/displayable             |
| 2   | [Entity editor completion](./02-entity-editor-completion.md) | 1 (partially)               | M    | Name, auth keys, publishing lifecycle, adapter extension point |
| 3   | [Rich text](./03-rich-text.md)                               | 1, 2 (adapter)              | L    | Lexical editor + display with entity/component nodes           |
| 4   | [Published mode](./04-published-mode.md)                     | 1 (display), 3 (RT display) | M    | Published provider + list + display screens                    |
| 5   | [Schema editor](./05-schema-editor.md)                       | — (parallel-safe)           | L    | SchemaEditorScreen equivalent                                  |
| 6   | [Changelog & history](./06-changelog-and-history.md)         | — (parallel-safe)           | S–M  | ChangelogListScreen + entity history dialog                    |
| 7   | [Public API & migration](./07-public-api-and-migration.md)   | all above                   | M    | Exports, types, consumer migration, legacy deprecation         |

Suggested execution order: 1 → 2 → 3 → 4, with 5 and 6 parallelizable at any point, and 7
running incrementally (export things as they stabilize, migrate consumers screen by
screen — `apps/blog` and `examples/astro` already run both libraries side by side, which
is the perfect harness).

## Cross-cutting conventions (apply to every workstream)

- **Naming**: react-components2 renamed `Admin*`→ no prefix and `SearchEntity*`→`ContentList*`.
  Keep that convention; do not import legacy names. Published variants get a `Published`
  prefix only where a separate component is genuinely needed — prefer `mode: 'full' | 'published'`
  props/generics (the reducers already model this).
- **UI**: build on `src/components/ui/` (shadcn, Radix, cva). Missing primitives are added
  via `npx shadcn@latest add <component>` against `components.json`, not hand-rolled. No
  dependency on `@dossierhq/design` may be introduced.
- **State**: plain reducers in `src/reducers/` with Vitest snapshot tests, mirroring
  `ContentListReducer`/`ContentEditorReducer` style. URL synchronizers follow the
  `addContent*ParamsToURLSearchParams` pattern.
- **Stories**: every new screen/major component gets a `.stories.tsx` backed by
  `StoryDossierProvider` (in-browser sql.js + `@dossierhq/test-data`). Chromatic covers
  visual regressions; `test:storybook` runs across firefox/chromium/webkit.
- **Verification loop**: `turbo run lint check-types build test` from the repo root (or the
  package dir), plus `pnpm start` (Storybook :6008) for manual checks, plus
  `apps/playground2` for end-to-end feel.
- **Changesets**: user-visible changes need `pnpm changeset:add`.

## Definition of done (full parity)

1. Every legacy screen has a react-components2 equivalent with the same capabilities
   (props may differ; behavior must not regress).
2. All 7 field types render and edit correctly, single and list, with validation.
3. `libraries/cloudinary` can implement its custom field editor against react-components2
   types.
4. `apps/playground`, `apps/blog`, `examples/next-web`, `examples/tutorial`,
   `examples/astro` run on react-components2 only; the `*2` side-by-side duplicates are
   collapsed.
5. Legacy `@dossierhq/react-components` is marked deprecated in its README and stops
   receiving feature work.
