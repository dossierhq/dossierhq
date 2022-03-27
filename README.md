## Development dependencies

- Use nvm to manage node version
- `npm install -g @microsoft/rush`
- `brew install deno` (for `examples/deno`)
- `brew install pgcli` (optional, for Postgres access)
- `brew install gnuplot` (for benchmarking)
- `brew install graphviz` (for documentation)

## VS Code extensions

- [Code Spell Checker](vscode:extension/streetsidesoftware.code-spell-checker)
- [ESLint](vscode:extension/dbaeumer.vscode-eslint)
- [Prettier](vscode:extension/esbenp.prettier-vscode)

## Getting started

- `rush update` to install dependencies.
- In `tools/generic-tools/`:
  - By default the databases (test and example databases on PostgreSQL) are configured in Docker. To use another db set the env variable `HOST_ROOT_DATABASE_URL`
  - `npm run db:start` (only if running db in Docker)
  - `npm run db:ensure-dbs`
  - `npm run db:make-users:superuser`
  - `npm run db:migrate:all`
  - `npm run db:make-users:no-superuser`
- `rush build`
- `rush ci:check`

## Dependencies

Run `rush add --package foo` instead of `npm install foo` (`rush add --package foo --dev` instead of `npm install --save-dev foo`).

Check that the same versions of dependencies are used, run `rush check`.

## Upgrade dependencies

- Upgrade node version in `.nvmrc`
- Upgrade deno version in Github Actions workflows (`deno-version`)
- Update `rushVersion` and `pnpmVersion` in `rush.json` (`npm show @microsoft/rush version`/`npm show pnpm version`)
- Either upgrade individual dependencies:
  - `rush add --package typescript@latest --dev --make-consistent` in project where dependency exist, or:
    - `./scripts/update-dependency.sh typescript "^4.3.5"`
    - `rush check && rush update`
- Or, upgrade all dependencies:
  - `npm run upgrade-dependencies:all`
  - `rush update --full`
  - `rush check`
- `rush ci:check`
- Exceptions:
  - In `examples/next-web`: `"next": "~10.0.8", "next-transpile-modules": "~6.3.0"`, "Module parse failed: Unexpected token (1:7)". Reverted to `"next": "~10.0.6", "next-transpile-modules": "~6.1.0"`

## Publish packages

- `rush change`
- `git add common/changes/ && git commit`
- `git push`
- Start [publish](https://github.com/jonasb/datadata/actions/workflows/publish.yml) workflow
