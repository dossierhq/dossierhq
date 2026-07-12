# Workstream 1: Field editors & display for all non-rich-text types

Depends on: nothing · Size: M · Unblocks: 2 (entity editor), 3 (rich text), 4 (published display)

## Goal

`FieldEditor.tsx` and `FieldDisplay.tsx` handle every field type except RichText
(RichText is workstream 3): Boolean, Number, String (incl. enum `values`), Location,
Reference, Component — each in single and list form, with validation issues shown.

## Current state

- `src/components/FieldEditor.tsx` — only `isStringSingleField`/`isStringListField`
  branches are live; boolean/reference/location/number/component branches exist as
  commented-out code (`FieldEditor.tsx:38`), fallthrough renders
  `"{type} (list: …) is not supported"`.
- `src/components/FieldDisplay.tsx` — same shape, same gaps (`FieldDisplay.tsx:33`).
- `StringFieldEditor.tsx` — works for input/textarea; enum (`values[]`) dropdown is a TODO
  (`StringFieldEditor.tsx:28,68`).
- List plumbing exists: `FieldListEditorWrapper` / `FieldListDisplayWrapper` +
  `AddStringListItemButton`; drag-and-drop reorder is a TODO (`FieldListEditorWrapper.tsx:62`).
- Validation plumbing exists and is type-agnostic (`ContentEditorReducer` runs
  `validateTraverseNodeForSave/Publish`); only the editing UI is missing.

## Legacy reference (behavior to match)

`libraries/react-components/src/components/EntityEditor/*` and `EntityDisplay/*`:

| Type        | Editor behavior                                                                                                                                               | Display behavior                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Boolean     | tri-state-aware checkbox (null vs false), clear button                                                                                                        | "true"/"false" text                                    |
| Number      | numeric input honoring `integer` variant; parse on blur/change (`NumberDisplayUtils`)                                                                         | formatted integer/float                                |
| String enum | dropdown when `fieldSpec.values` set                                                                                                                          | plain text                                             |
| Location    | button showing `lat, lng` opening a map picker dialog; clear                                                                                                  | static text + read-only map dialog                     |
| Reference   | "Add entity" button → entity selector dialog filtered by `fieldSpec.entityTypes`; shows entity name + type + status; click-to-open; remove                    | linked entity name, click-to-open via context callback |
| Component   | inline nested editor: type picker (filtered by `fieldSpec.componentTypes`), then renders the component's own fields recursively via FieldEditor; remove/clear | nested read-only field display                         |
| Lists       | every type gets an add-item button; items removable; reorderable                                                                                              | indexed read-only items                                |

## Tasks

### 1. Simple scalar editors/displays (Boolean, Number, String enum)

- `BooleanFieldEditor.tsx` + display: shadcn `checkbox` (add via shadcn CLI — not yet in
  `ui/`) with explicit null/unset handling like legacy.
- `NumberFieldEditor.tsx` + display: `ui/input` with `inputMode`/step from
  `fieldSpec.integer`; reuse `utils/NumberDisplayUtils.ts` (already ported).
- `StringValueFieldEditor` (enum): shadcn `select` or `dropdown-menu` when
  `fieldSpec.values` is non-empty; also wire `AddStringListItemButton` enum path
  (stub noted in `StringFieldEditor.tsx`).
- Uncomment/complete the corresponding branches + list wrappers in FieldEditor/FieldDisplay.

### 2. Location editor/display

- `LocationFieldEditor.tsx`: value chip + "select location" button opening a dialog with
  `@dossierhq/leaflet` map (dep already present; `ContentMap` shows the lazy-load pattern
  to copy — leaflet must stay out of the sync bundle).
- New `LocationSelectorDialog` (edit) and read-only location dialog (display), replacing
  legacy `AdminLocationSelectorDialog`/`PublishedLocationDisplayDialog`. Reuse
  `ui/dialog` + a draggable marker; port legacy `LocationReducer` if useful.

### 3. Reference editor/display

- `ReferenceFieldEditor.tsx`: renders selected entity as `EntityCard` (exists), remove
  button, "add" button.
- Entity selection: reuse the existing `OpenContentDialogContent` (dialog-embedded content
  list) rather than porting `AdminEntitySelectorDialog` — add props for
  `restrictEntityTypes` (ContentListReducer already supports it) and selection-mode
  (pick vs open). This is the biggest piece of this workstream; design it once, since
  workstream 3 (entity links in rich text) needs the same picker.
- Display side: entity name lookup via `useEntity`, click-to-open through a context
  callback (add `onOpenEntity`-style callback threading — see workstream 2's
  ContentEditor context).

### 4. Component (nested) editor/display

- `ComponentFieldEditor.tsx`: type picker (command-menu or dropdown filtered by
  `fieldSpec.componentTypes`), then recursive `EntityFieldEditor` rendering of the
  component's fields; "remove" action. Mirror legacy `ComponentFieldEditor`'s
  value-shape handling (`{ type, ...fields }`).
- Recursion already works in validation; make sure `SetField` accepts nested paths the
  same way legacy does (verify against `ContentEditorReducer` — legacy used
  item-path-based `SetField`).

### 5. List polish

- Add per-type add-item buttons (generalize `AddStringListItemButton` into
  `AddFieldListItemButton` parameterized by type).
- Drag-and-drop reorder (`FieldListEditorWrapper.tsx:62` TODO): use a small DnD approach
  consistent with what workstream 5 (schema field reorder) will need — pick one library
  (e.g. `@dnd-kit`) or native HTML DnD once, document the choice here before starting.

### 6. Adapter override hook (shared with workstream 2)

- Implement `renderFieldEditor`/`renderFieldDisplay` override checks at the top of
  FieldEditor/FieldDisplay (commented at `FieldEditor.tsx:29`, `FieldDisplay.tsx:24`).
  The adapter type itself is defined in workstream 2; land the call sites here.

## Testing & stories

- Extend `ContentEditorScreen.stories.tsx` scenarios to open entities from
  `@dossierhq/test-data` covering every field type (check test-data catalog has them;
  extend it if not — legacy stories exercised all types).
- Reducer tests: `SetField` with each value type, list add/remove/reorder, nested
  component field updates (extend `ContentEditorReducer.test.ts`).
- Chromatic snapshots per field type (one story per editor in isolation is acceptable).

## Acceptance criteria

- No entity in the test-data catalog renders a "not supported" placeholder except
  RichText fields.
- Save + publish work for entities using all implemented types in `apps/playground2`.
- Validation issues render under each editor type (required, matchPattern, values).
