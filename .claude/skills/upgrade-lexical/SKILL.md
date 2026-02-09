---
name: upgrade-lexical
description: Incrementally upgrade Lexical dependencies and sync copied playground code
disable-model-invocation: true
argument-hint: [target-version (optional)]
allowed-tools:
  - Bash(npm view lexical versions:*)
  - Bash(npm view @lexical/* versions:*)
  - Bash(pnpm install)
  - Bash(git add:*)
  - Bash(git commit:*)
  - Bash(git status)
  - Bash(git diff)
  - Edit(*/package.json)
  - Edit(**/third-party/lexical-playground/**/*.ts)
  - Edit(**/third-party/lexical-playground/**/*.tsx)
---

# Lexical Upgrade Skill

This skill automates the incremental upgrade of Lexical dependencies while synchronizing copied playground code.

## Workflow

### Phase 1: Version Discovery

1. Read the current Lexical version from `libraries/react-components/package.json`
2. Determine target version:
   - If user provided version as argument, use that
   - Otherwise, find next available version:
     - Use `npm view lexical versions --json` to get all versions
     - Filter out pre-release versions (containing -next, -nightly, -alpha, -beta, -rc)
     - Find next patch version (e.g., 0.14.3 → 0.14.4)
     - If no more patches, suggest next minor (e.g., 0.14.x → 0.15.0)
3. Display upgrade plan showing:
   - Current version
   - Target version
   - All packages that will be updated
4. Ask for confirmation to proceed

### Phase 1.5: Breaking Change Scan

5. Load breaking changes for target version from Lexical's changelog
6. For each breaking change in target version:
   - Display change type, description, and severity
   - If change has a pattern to detect, scan codebase:
     - Use Grep to search for matching patterns in affected files
     - Report files that match the pattern
   - If auto-fixable:
     - Show the fix that will be applied
     - Ask if user wants to auto-fix now or later
   - If not auto-fixable:
     - Show recommendation for manual fix
     - Ask user to confirm they've reviewed or want to proceed
7. Display summary:
   - Breaking changes in target version
   - Files potentially affected
   - Actions user should take
8. Offer to proceed with upgrade or abort

### Phase 2: Playground Repository Health Check

9. Check the Lexical mono repo (including playground) repo. Ask the user for the location if you don't know it:
   - ✓ Verify repo exists
   - ✓ Check `git status` - warn if uncommitted changes
   - ✓ Check `git branch --show-current` - warn if not on main/master
   - ✓ Check `git fetch --dry-run` - suggest pull if behind
   - ✓ Verify target version tag exists (try both `v{version}` and `{version}`)
   - ✓ Check if playground files in mapping exist in target version
10. If any checks fail:
    - Show specific error and suggested fix command
    - Example fix: "Run: cd /Users/jonas/dev/explore/lexical && git checkout main"
    - Ask user to fix before proceeding or skip playground sync

### Phase 2.5: File Discovery

11. Load auto-discovery configuration from `.claude/skills/upgrade-lexical/file-mapping.json`
12. If auto-discovery is enabled:
    - Use Glob to find files matching patterns (e.g., `libraries/react-components/src/**/*.{ts,tsx}`)
    - Use Grep to find files importing from `@lexical/` or `lexical`
    - Combine with known-file-groups and custom-nodes from file-mapping.json
    - Create comprehensive checklist:
      - Main editor/display components
      - Custom nodes (6 nodes)
      - Plugins (7 plugins)
      - Utilities
      - Any other files with Lexical imports
13. Display discovered files and ask user to confirm coverage
14. Save discovered file list for verification in Phase 5

### Phase 3: Playground Change Detection

15. Read the file mapping from `.claude/skills/upgrade-lexical/file-mapping.json`

16. For each file in the tracked-files mapping:
    - Check if playground file exists in both current and target versions
    - Run `git diff v{current}..v{target} -- {playground_path}` to see changes
    - If changes exist:
      - Analyze diff and classify change type:
        - 🐛 Bug fix (small logic changes)
        - ✨ Feature (new functions/exports)
        - ♻️ Refactor (structure changes)
        - 💥 Breaking change (API signature changes)
        - 🎨 Style (formatting only)
      - Show change summary with impact assessment
      - Display the diff to the user
      - For "exact-copy" files: Ask if user wants to auto-apply the changes
      - For "manual-review" files: Show changes for review only, don't auto-apply
    - If no changes: Note that file is already in sync

### Phase 4: Apply Playground Changes

17. For approved "exact-copy" files:
    - Read the file content from the target version: `cd $LEXICAL_REPO && git show v{target}:{playground_path}`
    - Write to the local file (preserving any copyright header if present)
    - Note which files were updated

### Phase 5: Update Dependencies

18. Update Lexical dependencies in `libraries/react-components/package.json`:
    - lexical
    - @lexical/code
    - @lexical/link
    - @lexical/list
    - @lexical/react
    - @lexical/rich-text
    - @lexical/selection
    - @lexical/utils

19. Update Lexical dependency in `apps/blog/package.json`:
    - lexical

20. Check `pnpm-workspace.yaml` for any version overrides that might conflict:
    - If overrides exist for Lexical packages, warn the user
    - Ask if they should be removed or updated

21. Run `pnpm install` to update the lockfile

### Phase 6: Verification

22. Build the project:
    - Run `pnpm -w build`
    - If errors occur:
      - Load error-patterns.json
      - Match error output against known patterns
      - For each matched pattern:
        - Show error description and cause
        - Show suggested fix
        - If auto-fixable, offer to apply fix automatically
        - If not auto-fixable, show code example and recommendation
      - If no patterns match, show generic troubleshooting steps
      - Ask how to proceed:
        - Apply suggested fixes and retry build
        - Skip this version and try next
        - Fix manually and continue
        - Abort upgrade

23. Run tests:
    - Run `pnpm -w test`
    - If failures occur:
      - Check for snapshot update needs
      - Match against test-related error patterns
      - Show test failure summary
      - Ask how to proceed:
        - Update snapshots if cosmetic changes
        - Fix manually if functional issues
        - Skip this version

24. Run linter:
    - Run `pnpm -w lint`
    - If errors occur, display them and ask how to proceed

### Phase 7: Commit

25. Stage all changes:
    - `libraries/react-components/package.json`
    - `apps/blog/package.json`
    - `pnpm-lock.yaml`
    - Any updated third-party playground files

26. Show git diff of staged changes for review

27. Create commit with message following repo conventions:

    ```
    chore(lexical): Upgrade from {old} to {new}

    - Updated lexical packages in react-components and blog
    - Synced getSelectedNode.ts from playground ({changes|no changes})
    - All tests passing
    ```

28. Commit the changes

### Phase 8: Iteration

32. Ask if user wants to continue upgrading to the next version
33. If yes, repeat from Phase 1 with the newly upgraded version as current

## Edge Cases

- **Playground repo not on main**: Show specific error and fix command (Phase 2)
- **Playground repo behind**: Suggest `git fetch && git pull` with full command (Phase 2)
- **Playground repo uncommitted changes**: Warn and suggest stashing or committing (Phase 2)
- **No target version found**: Show available versions and ask user to specify one (Phase 1)
- **Build/test failures**: Match against error-patterns.json, show fixes, offer auto-fix (Phase 6)
- **Override conflicts**: Check pnpm-workspace.yaml for version overrides (Phase 5)
- **Breaking changes detected**: Show in Phase 1.5, offer auto-fix before upgrading
- **Missing tags**: Try both `v{version}` and `{version}` formats (Phase 2)
- **File not found in playground**: Warn if mapped file doesn't exist in target version (Phase 3)
- **Auto-discovery finds no files**: Warn user, fall back to known-file-groups (Phase 2.5)
- **Multiple error patterns match**: Show all matching patterns and fixes (Phase 6)

## Version Selection Logic

When auto-detecting the next version:

1. Parse current version (e.g., "0.14.3")
2. Get all available versions from npm
3. Filter out pre-release versions
4. Find next patch in same minor (0.14.4, 0.14.5, etc.)
5. If no patches available, find next minor (0.15.0)
6. If no minors available, show available versions and ask user

## File Sync Types

- **exact-copy**: File is copied directly from playground with no modifications
  - Can be auto-applied with user approval
  - Preserves copyright headers

- **manual-review**: File is adapted from playground with custom changes
  - Show diff but never auto-apply
  - User must manually review and merge changes

## Safety Checks

- Detect breaking changes before upgrading (Phase 1.5)
- Always verify playground repo is clean and up-to-date (Phase 2)
- Auto-discover all affected files (Phase 2.5)
- Show all diffs before applying with impact analysis (Phase 3)
- Run build/test/lint before committing (Phase 6)
- Pattern-match errors and offer fixes (Phase 6)
- Ask for confirmation at key decision points
- Commit each version upgrade separately for easy rollback
- Maintain version consistency across all Lexical packages

## Example Usage

```bash
# Upgrade to next available version (auto-detect)
/upgrade-lexical

# Upgrade to specific version
/upgrade-lexical 0.15.0

# Upgrade through multiple versions (will prompt after each)
/upgrade-lexical 0.20.0
```

## Data Files

### file-mapping.json

Enhanced configuration file with:

- **tracked-files**: Playground files to sync (backwards compatible with old format)
- **auto-discover**: Patterns for finding all Lexical-related files
- **custom-nodes**: List of custom node classes with metadata
- **known-file-groups**: Main components, plugins, utilities
- **validation**: Required/optional methods for custom nodes

## Notes

- All version changes are committed separately for easy rollback
- The skill asks for confirmation at key decision points
- Playground changes are shown as diffs before applying with impact analysis
- Manual review is required for adapted files
- The skill will not automatically push commits - user must do that manually
- Breaking changes are detected proactively before upgrading
- Error patterns provide specific fix suggestions
- File discovery ensures no Lexical imports are missed
