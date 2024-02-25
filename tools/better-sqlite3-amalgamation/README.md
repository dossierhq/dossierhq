# `@dossierhq/better-sqlite3-amalgamation`

This package is mostly used for checking the coverage of core/server/sqlite-core. It runs the tests
in core, server and better-sqlite3 (including integration tests) in-situ, i.e. without compiling the
libraries and installing them to `node_modules` (which prevents coverage from being collected).

This package can also be used to run the TypeScript code directly with `tsx`, i.e. without compilation.
