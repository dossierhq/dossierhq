# Workstream 2: Entity editor completion

Depends on: 1 (partially — can start in parallel) · Size: M · Unblocks: 3, 7

## Goal

`ContentEditorScreen` reaches feature parity with legacy `ContentEditorScreen` for
everything around the fields: entity name, auth keys, publishing lifecycle, entity
links, robust draft handling, and the adapter extension point.

## Current state

- `EntityEditor.tsx:34–108`: name input, auth-key picker, and publishing button are
  commented out. Save / Save & publish buttons work via toasts.
- `ContentEditorReducer` already has `SetName`, `SetAuthKey`, name-linked-to-field logic,
  per-draft changed/validation state — the reducer is largely done; the UI is not.
- Known reducer gaps: server-side changes to a locally-modified draft are silently
  overwritten (`ContentEditorReducer.ts:555`), schema migrations not applied on
  `UpdateSchemaSpecification` (`ContentEditorReducer.ts:596–597`).
- No adapter/extension point; no entity links; no delete/archive/unpublish UI.

## Legacy reference

`libraries/react-components/src/components/EntityEditor/EntityEditor.tsx`,
`PublishingButton.tsx`, `AuthKeyPicker.tsx`, `screens/ContentEditorScreen.tsx`
(`AdminEntityLinks`), `contexts/DossierContext.ts` (`DossierContextAdapter`).

## Tasks

### 1. Entity name field

- Uncomment/rebuild the name input (`ui/input` + label) with the reducer's
  name-linked-to-field behavior (name auto-follows the nameField until manually edited).
- Show the entity id + copy button (legacy showed id in the sidebar).

### 2. Auth key picker

- Port `AuthKeyPicker`: only shown when the entity type's spec has an `authKeyPattern`;
  choices come from a `DisplayAuthKey[]`-equivalent provided by the app. Decide the
  delivery mechanism: legacy passed `authKeys` via `DossierProvider`; keep that (add an
  `authKeys` prop to `DossierProvider`/context).
- Disabled after creation (auth key is immutable) — match legacy.

### 3. Publishing lifecycle button

- Port `PublishingButton`: status-aware `dropdown-menu` offering
  publish / unpublish / archive / unarchive / delete based on `EntityStatus` and
  draft state; confirmation via `ui/alert-dialog` for destructive actions
  (delete/unpublish); success/failure via sonner toasts.
- `useCachingDossierMiddleware` already invalidates caches for these ops — verify each op
  round-trips (status badge on `EntityCard`/editor header updates).

### 4. Entity links (to/from)

- Legacy `AdminEntityLinks`: badge-buttons showing counts of entities linking to / linked
  from the open entity, opening the selector/list filtered by `linksTo`/`linksFrom`.
  `ContentListReducer` already supports `linksFrom`/`linksTo` — surface it via the
  open-content dialog with a preset query.

### 5. Adapter extension point (`DossierContextAdapter` equivalent)

- Define a react-components2 adapter interface:
  `renderFieldEditor(props): ReactNode | null` and
  `renderFieldDisplay(props): ReactNode | null` (+ rich-text component hooks added in
  workstream 3). `null` = fall through to built-in editors.
- Accept it as an optional `adapter` prop on `DossierProvider`; store in `DossierContext`.
- Export `FieldEditorProps`/`FieldDisplayProps` types (needed by `libraries/cloudinary`).
- Wire the call sites from workstream 1.

### 6. Draft robustness (reducer TODOs)

- `ContentEditorReducer.ts:555`: when the server entity changes under a locally-changed
  draft, keep local changes and surface a conflict indicator instead of silently
  overwriting (minimum: warn in UI, not `console.log`).
- `ContentEditorReducer.ts:596–597`: apply schema migrations to open drafts on
  `UpdateSchemaSpecification`.
- Error handling in `ContentEditorLoader.tsx:47` (currently TODO): render a load-failure
  state per draft instead of nothing.

### 7. Screen chrome parity check

- ~~Legacy had `header`/`footer` slots on every screen; ContentEditorScreen/ContentListScreen
  in react-components2 don't. Decide once (recommendation: add optional `header`/`footer`
  ReactNode props for parity — consumers like playground put nav bars there) and apply to
  all screens in later workstreams too.~~ **Decided 2026-07-16: added optional
  `header`/`footer` props to all six screens.** Screens keep owning the viewport; the shared
  `components/ScreenChrome.tsx` now holds the `h-dvh w-dvw` column and slots header/footer
  around the screen body. playground2 renders a ported `NavBar` there.
- Entity history dialog is deliberately deferred to workstream 6.

## Testing & stories

- Reducer tests for: publish→status transitions reflected in draft state, conflict
  path (UpdateEntity on changed draft), migration application.
- Stories: entity with authKeyPattern; published entity showing unpublish/archive menu;
  a story using a custom adapter that overrides one field editor (this doubles as the
  cloudinary contract test).

## Acceptance criteria

- Create → name auto-follows nameField → manual rename sticks.
- Auth-key-carrying entity types can be created with a chosen key; key is read-only after.
- All five lifecycle ops work from the editor with correct enable/disable per status.
- A consumer-supplied adapter can replace a field editor without forking the library.
