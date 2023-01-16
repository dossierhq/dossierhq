#!/usr/bin/env -S npx ts-node-esm
import { AdminSchema, type AdminSchemaSpecificationUpdate } from '@dossierhq/core';
import { generateTypescriptForSchema } from '@jonasb/datadata-typescript-generator';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { SCHEMA as BLOG_SCHEMA } from '../src/blog/schema.js';
import { SCHEMA as REVIEWS_SCHEMA } from '../src/reviews/schema.js';
import { SCHEMA as STARWARS_SCHEMA } from '../src/starwars/schema.js';

async function generateTypes(schemaSpec: AdminSchemaSpecificationUpdate, filename: string) {
  const adminSchema = AdminSchema.createAndValidate(schemaSpec).valueOrThrow();

  const sourceCode = generateTypescriptForSchema({ adminSchema, publishedSchema: null });
  await writeFile(filename, sourceCode, { encoding: 'utf8' });

  execFileSync('npx', ['prettier', '-w', filename]);
}

await generateTypes(BLOG_SCHEMA, './src/blog/schema-types.ts');
await generateTypes(REVIEWS_SCHEMA, './src/reviews/schema-types.ts');
await generateTypes(STARWARS_SCHEMA, './src/starwars/schema-types.ts');
