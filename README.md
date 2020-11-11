## Development dependencies

- Use nvm to manage node version
- `npm install -g @microsoft/rush`
- `brew install pgcli` (optional, for Postgres access)
- `brew install gnuplot` (for benchmarking)

## Getting started

`rush update` to install dependencies.

## Dependencies

Run `rush add --package foo` instead of `npm install foo` (`rush add --package foo --dev` instead of `npm install --save-dev foo`).

Check that the same versions of dependencies are used, run `rush check`.
