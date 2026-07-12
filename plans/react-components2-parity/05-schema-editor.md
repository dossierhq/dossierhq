# Workstream 5: Schema editor

Depends on: none (parallel-safe; shares DnD choice with workstream 1) · Size: L

## Goal

A `SchemaEditorScreen` equivalent: create/rename/delete entity types, component types,
indexes, and patterns; edit every field property; reorder fields; review and save the
schema update.

## Current state

Nothing exists. `useSchema` reads the spec; `ContentEditorReducer` has an
`UpdateSchemaSpecification` action that new schema saves must dispatch into (its
migration TODOs are handled in workstream 2).

## Legacy reference

`screens/SchemaEditorScreen.tsx`, `reducers/SchemaEditorReducer/*` (~30 actions),
`components/SchemaTypeEditor/*` (10 files), `SchemaIndexEditor`, `SchemaPatternEditor`,
six dialogs (`AddOrRenameTypeDialog`, `AddOrRenameFieldDialog`, `AddOrRenameIndexDialog`,
`AddOrRenamePatternDialog`, `EditPatternDialog`, `SaveSchemaDialog`).

## Approach

The reducer is the heart and is UI-framework-independent — **port
`SchemaEditorReducer` nearly verbatim** (it's well-tested with snapshots in legacy; port
the tests too). Then rebuild the UI in shadcn idiom, reusing react-components2 patterns:

- Screen layout: sidebar (types/indexes/patterns menu) + editor column, like
  `ContentEditorScreen`'s responsive layout; command menu (`CommandReducer`) for
  add-type/add-index/add-pattern/navigate, replacing some legacy toolbar buttons.
- Dialogs: shadcn `dialog` + `input` for add/rename (name validation: camelCase pattern
  checks live in the legacy dialogs — port them); `EditPatternDialog` with live regex
  tester; `SaveSchemaDialog` showing a summary/diff of pending changes before
  `client.updateSchemaSpecification`.
- Field editor rows: per-field controls for type, list, required, adminOnly,
  multiline (string), integer variant (number), index, matchPattern, enum values
  (`ValuesEditor`), allowed entity/component/link-entity types
  (`MultiCombobox` already exists in react-components2 — use it), allowed rich-text
  nodes (`RichTextNodeSelector` with the placeholder grouping:
  required set, `[code, code-highlight]`, `[list, listitem]`).
- Type-level controls: publishable (entity) / adminOnly (component), name-field selector
  (string non-list fields), auth-key `PatternSelector`.
- Drag-and-drop field reordering — same DnD mechanism chosen in workstream 1 task 5.

## Tasks

1. Port `SchemaEditorReducer` + tests (rename per naming conventions; keep action set:
   Add/Rename/Delete for types/fields/indexes/patterns, ~15 ChangeField* actions,
   ChangeType* actions, ReorderFields, SetActiveSelector, UpdateSchemaSpecification,
   `getSchemaSpecificationUpdateFromEditorState`).
2. Screen scaffold: menu + editor + `onEditorHasChangesChange` prop (parity with legacy:
   no URL sync — deliberate) + save flow with toasts and cache invalidation
   (`useCachingDossierMiddleware` handles `updateSchemaSpecification`? verify; legacy did).
3. Type editor UI (entity + component variants).
4. Field editor UI with all toggles/selectors.
5. Index + pattern editors and all six dialogs.
6. Draft-status tags (`TypeDraftStatusTag`: new/changed/unchanged) and delete flows with
   confirmation (`alert-dialog`).

## Testing & stories

- Ported reducer snapshot tests are the backbone.
- Story: full schema editing session against `StoryDossierProvider` (in-browser server
  accepts real schema updates — legacy had a combined ContentEditor+SchemaEditor story
  proving edits propagate; replicate it).
- Chromatic for the field-row permutations.

## Acceptance criteria

- Every schema mutation legacy supports can be performed and saved.
- Saving a schema change updates open content-editor drafts (via workstream 2's
  `UpdateSchemaSpecification` handling) in the combined story.
- Regex pattern tester and enum values editor behave like legacy.
