#!/usr/bin/env -S npx ts-node -T --esm
import { createConsoleLogger, getAllPagesForConnection } from '@dossierhq/core';
import { createDatabase, createSqlite3Adapter } from '@dossierhq/sqlite3';
import { config } from 'dotenv';
import assert from 'node:assert';
import { writeFile } from 'node:fs/promises';
import * as Sqlite from 'sqlite3';
import { SYSTEM_USERS } from '../config/SystemUsers.js';
import { BrowserUrls } from '../utils/BrowserUrls.js';
import type { AppPublishedClient } from '../utils/SchemaTypes.js';
import { assertIsPublishedArticle, assertIsPublishedBlogPost } from '../utils/SchemaTypes.js';
import { createBlogServer } from '../utils/SharedServerUtils.js';

// prefer .env.local file if exists, over .env file
config({ path: '.env.local' });
config({ path: '.env' });

// TODO @types/sqlite is slightly wrong in terms of CommonJS/ESM export
const { Database: SqliteDatabase } = (Sqlite as unknown as { default: typeof Sqlite }).default;

export {};

//TODO align usages of server/databases in scripts and backend
async function initializeServer() {
  assert.ok(process.env.DATABASE_SQLITE_FILE);
  const context = { logger: createConsoleLogger(console) };
  const databaseResult = await createDatabase(context, SqliteDatabase, {
    filename: process.env.DATABASE_SQLITE_FILE,
  });
  if (databaseResult.isError()) return databaseResult;

  const databaseAdapterResult = await createSqlite3Adapter(context, databaseResult.value, {
    migrate: true,
    fts: { version: 'fts4' }, // TODO use fts5 when github actions supports it ("SQL logic error"), match with create-database-from-disk.ts
    journalMode: 'wal',
  });
  if (databaseAdapterResult.isError()) return databaseAdapterResult;

  return await createBlogServer(databaseAdapterResult.value);
}

async function collectUrls(publishedClient: AppPublishedClient) {
  const hostname = 'https://www.dossierhq.dev';

  const urls: string[] = [];
  urls.push(hostname);

  urls.push(...(await articleUrls(hostname, publishedClient)));
  urls.push(`${hostname}${BrowserUrls.glossary}`);
  urls.push(`${hostname}${BrowserUrls.blog}`);
  urls.push(...(await blogUrls(hostname, publishedClient)));

  urls.sort();

  return urls;
}

async function articleUrls(hostname: string, publishedClient: AppPublishedClient) {
  const result: string[] = [];
  for await (const page of getAllPagesForConnection({ first: 100 }, (paging) =>
    publishedClient.searchEntities({ entityTypes: ['Article'] }, paging)
  )) {
    if (page.isOk()) {
      for (const edge of page.value.edges) {
        if (edge.node.isOk()) {
          const node = edge.node.value;
          assertIsPublishedArticle(node);
          result.push(`${hostname}${BrowserUrls.article(node.fields.slug)}`);
        }
      }
    }
  }
  return result;
}

async function blogUrls(hostname: string, publishedClient: AppPublishedClient) {
  const result: string[] = [];
  for await (const page of getAllPagesForConnection({ first: 100 }, (paging) =>
    publishedClient.searchEntities({ entityTypes: ['BlogPost'] }, paging)
  )) {
    if (page.isOk()) {
      for (const edge of page.value.edges) {
        if (edge.node.isOk()) {
          const node = edge.node.value;
          assertIsPublishedBlogPost(node);
          result.push(`${hostname}${BrowserUrls.blogPost(node.fields.slug)}`);
        }
      }
    }
  }
  return result;
}

async function main() {
  const { server } = (await initializeServer()).valueOrThrow();
  try {
    const authResult = await server.createSession(SYSTEM_USERS.serverRenderer);
    const publishedClient = server.createPublishedClient<AppPublishedClient>(
      async () => authResult
    );

    const urls = await collectUrls(publishedClient);
    await writeFile('public/sitemap.txt', urls.join('\n') + '\n', { encoding: 'utf8' });
  } finally {
    await server.shutdown();
  }
}

main();
