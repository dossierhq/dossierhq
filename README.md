## devenv.sh (development dependencies)

This project uses [https://devenv.sh/](devenv.sh) to manage development dependencies consistently and [direnv](https://direnv.net/) to automatically enable devenv. If you don't want to use devenv you can install the dependencies (rush, node, deno, bun etc) manually, but you're off the beaten path. You can see which dependencies are in used by checking [devenv.nix](./devenv.nix).

- Install [devenv](https://devenv.sh/getting-started/)
- Install [direnv](https://direnv.net/)

## Getting started

- `devenv shell` (or use direnv to automatically open the devenv shell)
- `rush update` to install dependencies.
- `devenv up` to start Postgres
- In `tools/generic-tools/`:
  - By default the PostgreSQL databases are run in devenv. To use another db set the env variable `HOST_ROOT_DATABASE_URL`
  - `npm run db:ensure-and-migrate-dbs`
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

- Update devenv version files in workflows: `https://github.com/cachix/devenv/tarball/v*`
- `devenv update` to update lock file
- Update `rushVersion` and `pnpmVersion` in `rush.json` (`npm show @microsoft/rush version`/`npm show pnpm version` – or use same version as rush: [rush.json](https://github.com/microsoft/rushstack/blob/main/rush.json))
- Upgrade individual dependencies in `tools/all-dependencies/`:
  - `rush add --package typescript@latest --dev --make-consistent`
  - or `rush upgrade-interactive`
- Upgrade dependencies in `examples/deno/config/import-map.json`

## Publish packages

- `rush change`
- `git add common/changes/ && git commit`
- `git push`
- Start [publish](https://github.com/jonasb/datadata/actions/workflows/publish.yml) workflow

## Ports

- 3001: examples/next-web
- 3002: apps/playground
- 3003: apps/blog
- 5432: devenv postgres db
- 6006: libraries/admin-react-components
- 6007: libraries/design
