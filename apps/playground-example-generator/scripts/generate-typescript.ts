#!/usr/bin/env -S deno run --allow-run=npx --allow-write=./src/reviews/schema-types.ts
import { AdminSchema } from '@jonasb/datadata-core';
import { generateTypescriptForSchema } from '@jonasb/datadata-typescript-generator';
import { SCHEMA as REVIEWS_SCHEMA } from '../src/reviews/SCHEMA.ts';

const schema = new AdminSchema(
  new AdminSchema({ entityTypes: [], valueTypes: [] }).mergeWith(REVIEWS_SCHEMA).valueOrThrow()
);
const sourceCode = generateTypescriptForSchema(schema);
await Deno.writeTextFile('./src/reviews/schema-types.ts', sourceCode);
const p = Deno.run({ cmd: ['npx', 'prettier', '-w', './src/reviews/schema-types.ts'] });
await p.status();
