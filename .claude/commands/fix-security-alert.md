---
description: Fix Dependabot security alert
allowed-tools: Bash(gh api repos/{owner}/{repo}/dependabot/alerts:*), Bash(gh repo view:*), Bash(npm view:*), Bash(pnpm why:*), Bash(pnpm audit:*)
---

## Context

The user wants to fix this security alert: $ARGUMENTS

## Task

### Step 1: Check Current Vulnerabilities (Primary Source)

**Use `pnpm audit` as the primary source of truth** for identifying actual vulnerabilities in the codebase:

```bash
pnpm audit
```

This command checks the lockfile against npm security advisories and shows:

- Currently vulnerable packages
- Severity levels
- Vulnerable version ranges
- Patched versions available
- Paths to vulnerable dependencies

**Important:** `pnpm audit` is always accurate for the current state of dependencies and doesn't depend on GitHub sync delays.

### Step 2: Verify with GitHub Dependabot (Optional)

If the user mentioned a specific Dependabot alert number, or you want to cross-reference with GitHub:

**Warning:** GitHub Dependabot API results may not always match what's shown in the GitHub UI due to sync delays or different filtering logic. When in doubt, trust `pnpm audit` results and ask the user to confirm which alert they want fixed.

To list Dependabot alerts:

```bash
gh api repos/{owner}/{repo}/dependabot/alerts --jq '.[] | select(.state=="open") | {number, dependency: .dependency.package.name, severity: .security_advisory.severity, summary: .security_advisory.summary}'
```

For a specific alert number, get full details:

```bash
gh api repos/{owner}/{repo}/dependabot/alerts/{number} --jq '{
  number,
  state,
  dependency: .dependency.package.name,
  manifest: .dependency.manifest_path,
  relationship: .dependency.relationship,
  vulnerable_range: .security_vulnerability.vulnerable_version_range,
  patched_version: .security_vulnerability.first_patched_version.identifier,
  severity: .security_advisory.severity,
  summary: .security_advisory.summary
}'
```

If the GitHub API shows multiple alerts but the user says only one is visible in the UI, ask them to confirm which specific vulnerability they want fixed rather than attempting to fix all API results.

### Step 3: Check Installed Version

Find the currently installed version and determine if it's a direct or transitive dependency:

```bash
pnpm why -r "dependency-name"
```

### Step 4: Apply the Fix

**Priority:** Focus on fixing vulnerabilities shown by `pnpm audit` first.

**For direct dependencies:**
Bump the version to at least the patched version, using `pnpm update "dependency-name"`. Double check that it a fixed version is used after.

**For transitive dependencies:**
First check if it can be fixed by upgrading any of the direct dependencies that introduce the transitive depedency. Add an override to `pnpm-workspace.yaml` in the `overrides` section:

```yaml
overrides:
  "dependency@previously-installed-vulnerable-version": "~patched-version"
```

Note: Use the specific vulnerable version on the left side (e.g., `qs@6.14.0`) and the patched version on the right (e.g., `~6.14.1`).

Note: We use `minimumReleaseAge` which means that we sometimes can't install the latest version with `pnpm`. If that's the case, add the dependency to the `minimumReleaseAgeExclude` list in `pnpm-workspace.yaml`.

### Step 5: Verify the Fix

1. Run `pnpm install` to update the lockfile
2. Verify with `pnpm audit` - should show 0 vulnerabilities (or at least the specific one is resolved)
3. Verify the new version: `grep "dependency@" pnpm-lock.yaml`
4. Run `pnpm -w build` to ensure no regressions

### Note

If you refer to the security alert in the commit message, use the full url, e.g. `https://github.com/dossierhq/dossierhq/security/dependabot/<alert-number>`, not `#<alert-number>` since it would be resolved to a PR.
