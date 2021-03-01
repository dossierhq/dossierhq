## Development dependencies

- Use nvm to manage node version
- `npm install -g @microsoft/rush`
- `brew install pgcli` (optional, for Postgres access)
- `brew install gnuplot` (for benchmarking)

## VS Code extensions

- [Code Spell Checker](vscode:extension/streetsidesoftware.code-spell-checker)
- [ESLint](vscode:extension/dbaeumer.vscode-eslint)
- [Prettier](vscode:extension/esbenp.prettier-vscode)

## Getting started

- `rush update` to install dependencies.
- `npm run db:start`
- `npm run db:ensure-dbs`
- `npm run db:make-users:superuser`
- `npm run db:migrate:all`
- `npm run db:make-users:no-superuser`

## Dependencies

Run `rush add --package foo` instead of `npm install foo` (`rush add --package foo --dev` instead of `npm install --save-dev foo`).

Check that the same versions of dependencies are used, run `rush check`.

## Upgrade dependencies

- Update `rushVersion` and `pnpmVersion` in `rush.json`
- `npm run upgrade-dependencies:all`
- `rush update`
- `rush check`
