#!/usr/bin/env -S deno run -q --allow-run=npx --allow-write=./src/reviews/schema-types.ts,./src/starwars/schema-types.ts
import { AdminSchema, type AdminSchemaSpecificationUpdate } from '@jonasb/datadata-core';
import { generateTypescriptForSchema } from '@jonasb/datadata-typescript-generator';
import { SCHEMA as REVIEWS_SCHEMA } from '../src/reviews/schema.ts';
import { SCHEMA as STARWARS_SCHEMA } from '../src/starwars/schema.ts';

async function generateTypes(schemaSpec: AdminSchemaSpecificationUpdate, filename: string) {
  const schema = new AdminSchema(
    new AdminSchema({ entityTypes: [], valueTypes: [] }).mergeWith(schemaSpec).valueOrThrow()
  );
  const sourceCode = generateTypescriptForSchema(schema);
  await Deno.writeTextFile(filename, sourceCode);

  await Deno.run({ cmd: ['npx', 'prettier', '-w', filename] }).status();
}

await generateTypes(REVIEWS_SCHEMA, './src/reviews/schema-types.ts');
await generateTypes(STARWARS_SCHEMA, './src/starwars/schema-types.ts');
