# Dossier

[![Node CI](https://github.com/dossierhq/dossierhq/actions/workflows/nodejs.yml/badge.svg)](https://github.com/dossierhq/dossierhq/actions/workflows/nodejs.yml) [![Benchmark](https://github.com/dossierhq/dossierhq/actions/workflows/benchmark.yml/badge.svg)](https://github.com/dossierhq/dossierhq/actions/workflows/benchmark.yml)

Dossier enables you to build solutions where you’re in full control of the content. By bringing your own auth (authentication and authorization), database and backend, you can build a headless Content Management System (CMS) and integrate it with your app.

For more information about Dossier, head over to [dossierhq.dev](https://www.dossierhq.dev). The rest of this readme is focused on developing and contributing to Dossier itself.

## Published packages

| Package                           | Version                                                                                                                                      | Folder                                                              |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `@dossierhq/better-sqlite3`       | [![npm version](https://badge.fury.io/js/@dossierhq%2Fbetter-sqlite3.svg)](https://badge.fury.io/js/@dossierhq%2Fbetter-sqlite3)             | [libraries/better-sqlite3](./libraries/better-sqlite3/)             |
| `@dossierhq/cloudinary`           | [![npm version](https://badge.fury.io/js/@dossierhq%2Fcloudinary.svg)](https://badge.fury.io/js/@dossierhq%2Fcloudinary)                     | [libraries/cloudinary](./libraries/cloudinary/)                     |
| `@dossierhq/core`                 | [![npm version](https://badge.fury.io/js/@dossierhq%2Fcore.svg)](https://badge.fury.io/js/@dossierhq%2Fcore)                                 | [libraries/core](./libraries/core/)                                 |
| `@dossierhq/core-vitest`          | [![npm version](https://badge.fury.io/js/@dossierhq%2Fcore-vitest.svg)](https://badge.fury.io/js/@dossierhq%2Fcore-vitest)                   | [libraries/core-vitest](./libraries/core-vitest/)                   |
| `@dossierhq/database-adapter`     | [![npm version](https://badge.fury.io/js/@dossierhq%2Fdatabase-adapter.svg)](https://badge.fury.io/js/@dossierhq%2Fdatabase-adapter)         | [libraries/database-adapter](./libraries/database-adapter/)         |
| `@dossierhq/design`               | [![npm version](https://badge.fury.io/js/@dossierhq%2Fdesign.svg)](https://badge.fury.io/js/@dossierhq%2Fdesign)                             | [libraries/design](./libraries/design/)                             |
| `@dossierhq/graphql`              | [![npm version](https://badge.fury.io/js/@dossierhq%2Fgraphql.svg)](https://badge.fury.io/js/@dossierhq%2Fgraphql)                           | [libraries/graphql](./libraries/graphql/)                           |
| `@dossierhq/integration-test`     | [![npm version](https://badge.fury.io/js/@dossierhq%2Fintegration-test.svg)](https://badge.fury.io/js/@dossierhq%2Fintegration-test)         | [libraries/integration-test](./libraries/integration-test/)         |
| `@dossierhq/leaflet`              | [![npm version](https://badge.fury.io/js/@dossierhq%2Fleaflet.svg)](https://badge.fury.io/js/@dossierhq%2Fleaflet)                           | [libraries/leaflet](./libraries/leaflet/)                           |
| `@dossierhq/pg`                   | [![npm version](https://badge.fury.io/js/@dossierhq%2Fpg.svg)](https://badge.fury.io/js/@dossierhq%2Fpg)                                     | [libraries/pg](./libraries/pg/)                                     |
| `@dossierhq/postgres-core`        | [![npm version](https://badge.fury.io/js/@dossierhq%2Fpostgres-core.svg)](https://badge.fury.io/js/@dossierhq%2Fpostgres-core)               | [libraries/postgres-core](./libraries/postgres-core/)               |
| `@dossierhq/postgres-tools`       | [![npm version](https://badge.fury.io/js/@dossierhq%2Fpostgres-tools.svg)](https://badge.fury.io/js/@dossierhq%2Fpostgres-tools)             | [libraries/postgres-tools](./libraries/postgres-tools/)             |
| `@dossierhq/react-components`     | [![npm version](https://badge.fury.io/js/@dossierhq%2Freact-components.svg)](https://badge.fury.io/js/@dossierhq%2Freact-components)         | [libraries/react-components](./libraries/react-components/)         |
| `@dossierhq/server`               | [![npm version](https://badge.fury.io/js/@dossierhq%2Fserver.svg)](https://badge.fury.io/js/@dossierhq%2Fserver)                             | [libraries/server](./libraries/server/)                             |
| `@dossierhq/sqlite-core`          | [![npm version](https://badge.fury.io/js/@dossierhq%2Fsqlite-core.svg)](https://badge.fury.io/js/@dossierhq%2Fsqlite-core)                   | [libraries/sqlite-core](./libraries/sqlite-core/)                   |
| `@dossierhq/typescript-generator` | [![npm version](https://badge.fury.io/js/@dossierhq%2Ftypescript-generator.svg)](https://badge.fury.io/js/@dossierhq%2Ftypescript-generator) | [libraries/typescript-generator](./libraries/typescript-generator/) |

## Development dependencies

- Use [asdf](https://asdf-vm.com/) to install the tools in `.tools-versions`
- `npm install -g @microsoft/rush`
- `brew install pgcli` (optional, for Postgres access)
- `brew install gnuplot` (for benchmarking)
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

## Dev container / Github Code Spaces

- Start dev container
- The script [post-create.sh](./.devcontainer/scripts/post-create.sh) runs automatically on first run
- When done, restart your shell since it sets up environment variables
- For root access to the Postgres database, run `psql "$HOST_ROOT_DATABASE_URL"` or `pgcli "$HOST_ROOT_DATABASE_URL"`

## Dependencies

- Run `rush add --package foo` instead of `npm install foo` (`rush add --package foo --dev` instead of `npm install --save-dev foo`)
- Run `cd tools/all-dependencies && npm run build`
- Check that the same versions of dependencies are used, run `rush check`.

## Upgrade dependencies

- Upgrade tool versions in `.tool-versions`
- Update `rushVersion` and `pnpmVersion` in `rush.json` (`npm show @microsoft/rush version`/`npm show pnpm version` – or use same version as rush: [rush.json](https://github.com/microsoft/rushstack/blob/main/rush.json))
- Upgrade individual dependencies in `tools/all-dependencies/`:
  - `npm run outdated` to get a list of outdated dependencies
  - `rush add --package typescript@latest --dev --make-consistent`
  - or `rush upgrade-interactive`
- Upgrade Deno dependencies in the 3 `import-map.json` files
- Run `(cd tools/generic-tools && npm run deno:reload-dependencies:all)`
- Upgrade the postgres version in `./docker-compose.yml`

## Publish packages

- Normally publishing the packages bumps the patch version, change `nextBump` to `minor` in [common/config/rush/version-policies.json](./common/config/rush/version-policies.json) to bump minor instead
- `rush change`
- `git add common/changes/ && git commit`
- `git push`
- Start [publish](https://github.com/dossierhq/dossierhq/actions/workflows/publish.yml) workflow
- When done, change back `nextBump` to `patch` if you changed it

## Ports

- 3000: examples/tutorial
- 3001: examples/next-web
- 3002: apps/playground
- 3003: apps/blog
- 4321: examples/astro
- 5173: examples/tutorial
- 6006: libraries/react-components
- 6007: libraries/design
- 9000: libraries/libsql - admin entity
- 9001: libraries/libsql - advisory lock
- 9002: libraries/libsql - advisory lock
- 9003: libraries/libsql - published entity
- 9004: libraries/libsql - schema
