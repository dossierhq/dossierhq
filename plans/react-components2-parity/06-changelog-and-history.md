# Workstream 6: Changelog screen & entity history

Depends on: none (parallel-safe) · Size: S–M

## Goal

Port the audit-trail features: `ChangelogListScreen` (site-wide event list) and the
per-entity history (legacy `AdminEntityHistoryDialog` with version diff selection,
`EntityChangelogList` in the editor sidebar).

Note: this is the workstream to cut first if the scope decision (see README) lands on
"editing parity only" — no current react-components2 consumer uses these yet, and they
are admin conveniences rather than core editing.

## Legacy reference

- `screens/ChangelogListScreen.tsx` + `ChangelogList`, `ChangelogConnectionButtons`,
  `reducers/ChangelogReducer/*` (+ URL synchronizer), hooks `useAdminChangelogEvents`,
  `useAdminChangelogEventsTotalCount`, `useAdminLoadChangelog`.
- `components/AdminEntityHistoryDialog/*` (`VersionSelectionReducer` for picking
  left/right versions), `components/EntityChangelogList`.
- `ConnectionPagingButtons`/`ConnectionPagingCount` — already ported to
  react-components2 (used by content list); reuse.

## Tasks

### 1. ChangelogListScreen

- Port `ChangelogReducer` (+ tests) and its URL synchronizer following the
  `ContentListUrlSynchronizer` pattern (export an `addChangelogParamsToURLSearchParams`).
- Hooks: `useChangelogEvents`, `useChangelogEventsTotalCount`, `useLoadChangelog`
  (SWR, mirroring `useEntities` family).
- UI: table/list of events (event type, entity name(s), version, author, date via
  `DateDisplay` — exists), reverse toggle, entity filter; paging via existing
  `ConnectionPagingButtons` + count.
- Screen with `urlSearchParams`/`onUrlSearchParamsChange` + command-menu entry points
  consistent with other screens.

### 2. Entity changelog in editor

- `EntityChangelogList` equivalent: changelog query filtered to the open entity,
  shown in the editor (legacy: draft sidebar; react-components2: probably a
  collapsible section — `ui/collapsible` exists — or a command-menu-opened dialog).

### 3. Entity history / version diff (optional tier)

- `AdminEntityHistoryDialog` equivalent: list versions, select two, show field-level
  diff. Legacy's `VersionSelectionReducer` is small — port it.
- Legacy's "diff" was side-by-side version display; decide whether to keep that or
  invest in a real field diff. Recommendation: side-by-side `EntityFieldDisplay`
  panes first (cheap, reuses workstream 1 display components).

## Testing & stories

- Reducer tests (port legacy `ChangelogReducer.test.ts` snapshots).
- Story: changelog screen against `StoryDossierProvider` (test-data generates events
  as it seeds; verify volume is enough for paging).
- Story: editor with history dialog open on a multi-version entity.

## Acceptance criteria

- Site-wide changelog with paging, ordering, and URL sync.
- Per-entity event history reachable from the content editor.
- (Tier 3) Two versions of an entity viewable side by side.
