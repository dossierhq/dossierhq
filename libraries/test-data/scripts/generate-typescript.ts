#!/usr/bin/env -S bun
import { writeFile } from 'node:fs/promises';
import { Schema, type SchemaSpecificationUpdate } from '@dossierhq/core';
import { generateTypescriptForSchema } from '@dossierhq/typescript-generator';
import { format, resolveConfig } from 'prettier';
import { SCHEMA as BLOG_SCHEMA } from '../src/blog/schema.js';
import { SCHEMA as CATALOG_SCHEMA } from '../src/catalog/schema.js';
import { SCHEMA as REVIEWS_SCHEMA } from '../src/reviews/schema.js';
import { SCHEMA as STARWARS_SCHEMA } from '../src/starwars/schema.js';

async function generateTypes(
  schemaSpec: SchemaSpecificationUpdate,
  filename: string,
  { authKeyPatternTypeMap }: { authKeyPatternTypeMap?: Record<string, string> } = {},
) {
  const schema = Schema.createAndValidate(schemaSpec).valueOrThrow();

  const sourceCode = generateTypescriptForSchema({
    schema,
    publishedSchema: null,
    authKeyPatternTypeMap,
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
  authKeyPatternTypeMap: { subject: "'subject'" },
});
await generateTypes(STARWARS_SCHEMA, './src/starwars/schema-types.ts');
