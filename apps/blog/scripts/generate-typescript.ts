#!/usr/bin/env -S bun
import { AdminSchema, type AdminSchemaSpecificationUpdate } from '@jonasb/datadata-core';
import { generateTypescriptForSchema } from '@jonasb/datadata-typescript-generator';
import { writeFile } from 'node:fs/promises';
import { schemaSpecification } from '../utils/schema.js';

async function generateTypes(schemaSpec: AdminSchemaSpecificationUpdate, filename: string) {
  const adminSchema = new AdminSchema({
    entityTypes: [],
    valueTypes: [],
    patterns: [],
    indexes: [],
  })
    .mergeWith(schemaSpec)
    .valueOrThrow();

  const publishedSchema = adminSchema.toPublishedSchema();
  const sourceCode = generateTypescriptForSchema({ adminSchema: null, publishedSchema });
  await writeFile(filename, sourceCode);

  await Bun.spawn({ cmd: ['npx', 'prettier', '-w', filename] }).exited;
}

await generateTypes(schemaSpecification, './utils/SchemaTypes.ts');
