# Workstream 3: Rich text (Lexical)

Depends on: 1 (reference picker), 2 (adapter) · Size: L — the single largest gap

## Goal

RichText fields are editable and displayable in react-components2 with the same node
set and behaviors as legacy: formatted text, headings, lists/checklists, code with
syntax highlighting, external links, entity links, embedded entities, embedded
components — gated by `fieldSpec.richTextNodes`.

## Current state

Nothing exists. No lexical dependency. `RichTextFieldEditor`/`RichTextFieldDisplay`
appear only as commented-out branches in `FieldEditor.tsx`/`FieldDisplay.tsx`.

## Legacy reference

`libraries/react-components/src/components/RichTextEditor/*` (12 files),
`RichTextDisplay/*` (6 files), `third-party/lexical-playground/*`, Lexical 0.45
(recently bumped — reuse the same version set: `lexical`, `@lexical/react`,
`@lexical/code`, `@lexical/code-prism`, `@lexical/link`, `@lexical/list`,
`@lexical/rich-text`, `@lexical/selection`, `@lexical/utils`).

Node/plugin inventory to reproduce:

- **Editor nodes**: EntityLinkNode, EntityNode, ComponentNode (admin variants),
  CodeNode + CodeHighlightNode, HeadingNode, LinkNode, ListNode + ListItemNode.
- **Editor plugins**: ToolbarPlugin (respects allowed nodes from `fieldSpec`),
  RichTextPlugin, ClickableLinkPlugin, CheckListPlugin, CodeHighlightPrismPlugin,
  EntityLinkPlugin, EntityPlugin, ComponentPlugin, HistoryPlugin, LinkPlugin,
  ListPlugin, debounced OnChangePlugin, CreateLinkDialog.
- **Display**: read-only RichTextPlugin + published node variants +
  PublishedClickableLinkPlugin.

## Design decisions to make up front

1. **Theme**: legacy used `LexicalTheme` from `@dossierhq/design`. Rebuild as a Tailwind
   class map (Lexical themes are just className maps — define in
   `src/components/richtext/theme.ts` using prose-like utility classes; verify dark mode).
2. **Naming**: drop the `Admin`/`Published` node prefixes if one node class can serve both
   modes with a context switch; otherwise keep two thin node classes sharing a base, as
   legacy did. Recommendation: try shared nodes + mode from context first — less code,
   and the reducers already use the mode-flag pattern.
3. **Bundle size**: lexical + prism are heavy. Lazy-load the whole rich-text editor the
   way `ContentMap` is lazy-loaded, so consumers without rich text don't pay for it
   (`tools/tree-shake-tester` should be extended to check this).

## Tasks

### 1. Scaffolding

- Add lexical deps (match legacy's pinned minor). Create
  `src/components/richtext/` with `RichTextFieldEditor`, `RichTextFieldDisplay`,
  shared `theme.ts`, contexts.
- Wire the FieldEditor/FieldDisplay branches + list wrappers.
- Baseline: plain text + paragraphs round-trip to the Dossier rich-text JSON format
  (`@dossierhq/core` rich-text utilities).

### 2. Formatting & structure

- ToolbarPlugin: bold/italic/underline/code inline formats, block type dropdown
  (paragraph/heading/list/code), undo/redo. Build from shadcn `toggle-group` +
  `dropdown-menu` (all present in `ui/`). Gate buttons on
  `fieldSpec.richTextNodes` exactly as legacy does.
- Lists + checklists, headings, code blocks with `CodeHighlightPrismPlugin`.
- History plugin + debounced onChange (lodash already a dep).

### 3. Links

- LinkPlugin + ClickableLinkPlugin + CreateLinkDialog (shadcn `dialog` + `input`).
- EntityLinkPlugin + EntityLinkNode: pick an entity via the workstream-1 selector dialog
  (restricted by `fieldSpec.linkEntityTypes`); render as link; click-to-open in editor
  via modifier-click like legacy's ClickableLinkPlugin.

### 4. Embedded entities & components

- EntityNode (block-level embedded entity): renders `EntityCard`, remove button.
- ComponentNode: renders nested component fields via `EntityFieldEditor` (recursion from
  workstream 1), plus adapter hook `renderRichTextComponentEditor` /
  `renderRichTextComponentDisplay` (extend the workstream-2 adapter and export the props
  types — legacy exported `RichTextComponentEditorProps`/`RichTextComponentDisplayProps`).

### 5. Display variant

- Read-only composer with published nodes/behaviors: entity links resolve via published
  context callbacks (depends on workstream 4 for the published context, but can land
  admin-display first).

### 6. Validation integration

- Rich-text child validation already flows through `validateTraverseNodeForSave/Publish`;
  make sure `ValidationIssuesDisplay` anchors to the right node paths and the editor
  shows per-node issues like legacy.

## Testing & stories

- Story per capability tier: formatting-only field, links field, embedded
  entity/component field, restricted-nodes field (toolbar gating visible).
- Round-trip unit tests: Dossier JSON → Lexical state → Dossier JSON stability
  (legacy relied on reducer snapshots; add explicit conversion tests here).
- storybook test-runner across all three browsers (contenteditable is browser-sensitive);
  Chromatic snapshots for toolbar states.

## Acceptance criteria

- All rich-text entities in test-data render and are editable without console errors.
- `fieldSpec.richTextNodes` restrictions hide/disable exactly the disallowed nodes.
- Cloudinary-style adapter can render a custom component inside rich text.
- Editor is code-split; importing `ContentListScreen` alone does not pull lexical.
