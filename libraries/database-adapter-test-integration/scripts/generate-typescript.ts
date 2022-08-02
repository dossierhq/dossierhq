#!/usr/bin/env -S deno run -q --allow-run=npx --allow-write=./src/SchemaTypes.ts
import { AdminSchema, type AdminSchemaSpecificationUpdate } from '@jonasb/datadata-core';
import { generateTypescriptForSchema } from '@jonasb/datadata-typescript-generator';
import { IntegrationTestSchema } from '../src/IntegrationTestSchema.ts';

async function generateTypes(schemaSpec: AdminSchemaSpecificationUpdate, filename: string) {
  const schema = new AdminSchema(
    new AdminSchema({ entityTypes: [], valueTypes: [] }).mergeWith(schemaSpec).valueOrThrow()
  );
  const sourceCode = generateTypescriptForSchema(schema);
  await Deno.writeTextFile(filename, sourceCode);

  await Deno.run({ cmd: ['npx', 'prettier', '-w', filename] }).status();
}

await generateTypes(IntegrationTestSchema, './src/SchemaTypes.ts');
