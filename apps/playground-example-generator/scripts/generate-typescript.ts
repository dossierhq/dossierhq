#!/usr/bin/env -S bun
import { AdminSchema, type AdminSchemaSpecificationUpdate } from '@dossierhq/core';
import { generateTypescriptForSchema } from '@dossierhq/typescript-generator';
import { writeFile } from 'node:fs/promises';
import { format, resolveConfig } from 'prettier';
import { SCHEMA as BLOG_SCHEMA } from '../src/blog/schema.js';
import { SCHEMA as CATALOG_SCHEMA } from '../src/catalog/schema.js';
import { SCHEMA as REVIEWS_SCHEMA } from '../src/reviews/schema.js';
import { SCHEMA as STARWARS_SCHEMA } from '../src/starwars/schema.js';

async function generateTypes(
  schemaSpec: AdminSchemaSpecificationUpdate,
  filename: string,
  { authKeyType }: { authKeyType?: string } = {},
) {
  const adminSchema = AdminSchema.createAndValidate(schemaSpec).valueOrThrow();

  const sourceCode = generateTypescriptForSchema({
    adminSchema,
    publishedSchema: null,
    authKeyType,
  });

  const prettierConfig = await resolveConfig(filename);
  const formattedSource = await format(sourceCode, {
    ...prettierConfig,
    filepath: filename,
  });

  await writeFile(filename, formattedSource, { encoding: 'utf8' });
}

await generateTypes(BLOG_SCHEMA, './src/blog/schema-types.ts');
await generateTypes(CATALOG_SCHEMA, './src/catalog/schema-types.ts');
await generateTypes(REVIEWS_SCHEMA, './src/reviews/schema-types.ts', {
  authKeyType: "''|'subject'",
});
await generateTypes(STARWARS_SCHEMA, './src/starwars/schema-types.ts');
