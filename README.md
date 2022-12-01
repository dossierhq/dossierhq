## Development dependencies

- Use nvm to manage node version
- `npm install -g @microsoft/rush`
- `brew install deno` (for `examples/deno`)
- `brew install pgcli` (optional, for Postgres access)
- `brew install gnuplot` (for benchmarking)
- `brew install graphviz` (for documentation)
- `curl https://bun.sh/install | bash` (for [Bun](https://bun.sh/), needed by `examples/bun`)
- `npx playwright install` (for installing browsers for Playwright testing)

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

## Dependencies

- Run `rush add --package foo` instead of `npm install foo` (`rush add --package foo --dev` instead of `npm install --save-dev foo`)
- Run `cd tools/all-dependencies && npm run build`
- Check that the same versions of dependencies are used, run `rush check`.

## Upgrade dependencies

- Upgrade node version in `.nvmrc`
- Upgrade deno version in Github Actions workflows (`deno-version`)
- Bun is automatically using the latest version on GitHub Actions
- Update `rushVersion` and `pnpmVersion` in `rush.json` (`npm show @microsoft/rush version`/`npm show pnpm version` – or use same version as rush: [rush.json](https://github.com/microsoft/rushstack/blob/main/rush.json))
- Upgrade individual dependencies in `tools/all-dependencies/`:
  - `rush add --package typescript@latest --dev --make-consistent`
  - or `rush upgrade-interactive`
- Upgrade dependencies in `examples/deno/config/import-map.json`
- Upgrade the postgres version in `./docker-compose.yml`

## Publish packages

- `rush change`
- `git add common/changes/ && git commit`
- `git push`
- Start [publish](https://github.com/jonasb/datadata/actions/workflows/publish.yml) workflow

## Ports

- 3001: examples/next-web
- 3002: apps/playground
- 3003: apps/blog
- 6006: libraries/admin-react-components
- 6007: libraries/design
