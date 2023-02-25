#!/usr/bin/env -S npx ts-node -T --esm
/* eslint-disable @next/next/no-img-element */
import { Cloudinary } from '@cloudinary/url-gen';
import type { RichText, RichTextElementNode, RichTextNode } from '@dossierhq/core';
import {
  assertIsDefined,
  createConsoleLogger,
  getAllPagesForConnection,
  isRichTextCodeHighlightNode,
  isRichTextCodeNode,
  isRichTextElementNode,
  isRichTextEntityLinkNode,
  isRichTextHeadingNode,
  isRichTextLineBreakNode,
  isRichTextLinkNode,
  isRichTextListItemNode,
  isRichTextListNode,
  isRichTextParagraphNode,
  isRichTextRootNode,
  isRichTextTextNode,
  isRichTextValueItemNode,
  richTextTextNodeHasFormat,
} from '@dossierhq/core';
import { createDatabase, createSqlite3Adapter } from '@dossierhq/sqlite3';
import { config } from 'dotenv';
import assert from 'node:assert';
import { writeFile } from 'node:fs/promises';
import type { Key, ReactNode } from 'react';
import * as ReactDOMServer from 'react-dom/server';
import * as Sqlite from 'sqlite3';
import { SYSTEM_USERS } from '../config/SystemUsers.js';
import { BrowserUrls } from '../utils/BrowserUrls.js';
import { getResponsiveImageUrlsForLimitFit } from '../utils/CloudinaryUtils.js';
import type {
  AppPublishedClient,
  AppPublishedEntity,
  AppPublishedExceptionClient,
  PublishedAuthor,
  PublishedBlogPost,
  PublishedCloudinaryImage,
} from '../utils/SchemaTypes.js';
import {
  assertIsPublishedAuthor,
  assertIsPublishedBlogPost,
  isPublishedArticle,
  isPublishedCloudinaryImage,
  isPublishedGlossaryTerm,
} from '../utils/SchemaTypes.js';
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

async function generateAtomFeed(publishedClient: AppPublishedExceptionClient) {
  const hostname = 'https://www.dossierhq.dev';
  const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:base="${hostname}/">
  <title>Dossier blog</title>
  <link href="/atom.xml" rel="self" />
  <link href="${BrowserUrls.blog}" />
  <id>${hostname}/</id>
  <icon>/favicon.svg</icon>
  <logo>/logo-large.svg</logo>
  <updated>${new Date().toISOString()}</updated>
${(await generateBlogEntries(hostname, publishedClient)).join('\n')}
</feed>
`;
  return feed;
}

async function generateBlogEntries(hostname: string, publishedClient: AppPublishedExceptionClient) {
  const blogPosts: PublishedBlogPost[] = [];

  for await (const page of getAllPagesForConnection({ first: 100 }, (paging) =>
    publishedClient.client.searchEntities({ entityTypes: ['BlogPost'] }, paging)
  )) {
    if (page.isOk()) {
      for (const edge of page.value.edges) {
        if (edge.node.isOk()) {
          const node = edge.node.value;
          assertIsPublishedBlogPost(node);
          blogPosts.push(node);
        }
      }
    }
  }

  blogPosts.sort((a, b) => a.fields.publishedDate.localeCompare(b.fields.publishedDate));

  const authorIds = new Set<string>();
  blogPosts.forEach((post) => post.fields.authors?.forEach((author) => authorIds.add(author.id)));
  const authorResults = await publishedClient.getEntities([...authorIds].map((id) => ({ id })));

  const authors: Record<string, PublishedAuthor> = {};
  authorResults.forEach((result) => {
    const author = result.valueOrThrow();
    assertIsPublishedAuthor(author);
    authors[author.id] = author;
  });

  return Promise.all(
    blogPosts.map((blogPost) => {
      const blogPostAuthors =
        blogPost.fields.authors?.map((reference) => authors[reference.id]) ?? [];
      return generateBlogEntry(hostname, publishedClient, blogPost, blogPostAuthors);
    })
  );
}

async function generateBlogEntry(
  hostname: string,
  publishedClient: AppPublishedExceptionClient,
  blogPost: PublishedBlogPost,
  authors: PublishedAuthor[]
) {
  const referencedEntities: Record<string, AppPublishedEntity> = {};
  for await (const page of getAllPagesForConnection({ first: 100 }, (paging) =>
    publishedClient.client.searchEntities({ linksFrom: { id: blogPost.id } }, paging)
  )) {
    if (page.isOk()) {
      for (const edge of page.value.edges) {
        if (edge.node.isOk()) {
          const node = edge.node.value;
          referencedEntities[node.id] = node;
        }
      }
    }
  }

  const content = ReactDOMServer.renderToStaticMarkup(
    <>
      <FeedCloudinaryImage image={blogPost.fields.hero} aspectRatio="16/9" />
      <FeedRichTextRenderer richText={blogPost.fields.body} entities={referencedEntities} />
    </>
  );

  const updated = new Date(blogPost.fields.updatedDate ?? blogPost.fields.publishedDate);

  return `  <entry>
    <title>${blogPost.fields.title}</title>
    <link href="${BrowserUrls.blogPost(blogPost.fields.slug)}" />
    <id>${hostname}${BrowserUrls.blogPost(blogPost.fields.slug)}</id>
${authors.map((author) => `    <author><name>${author.fields.name}</name></author>`).join('\n')}
    <updated>${updated.toISOString()}</updated>
    <published>${new Date(blogPost.fields.publishedDate).toISOString()}</published>
    <content type="xhtml"><div xmlns="http://www.w3.org/1999/xhtml">${content}</div></content>
  </entry>`;
}

function FeedCloudinaryImage(
  props: { image: PublishedCloudinaryImage } & ({ height: 400 } | { aspectRatio: '16/9' })
) {
  const { image } = props;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  assertIsDefined(cloudName);
  const cld = new Cloudinary({
    cloud: { cloudName },
    url: { forceVersion: false, analytics: false },
  });

  if ('height' in props) {
    const height = props.height;
    const width = Math.round((height * image.width) / image.height);

    const { src, srcSet } = getResponsiveImageUrlsForLimitFit(cld, image.publicId, width, height);

    return (
      <div style={{ textAlign: 'center' }}>
        <img
          alt={image.alt ?? ''}
          width={width}
          height={height}
          src={src}
          srcSet={srcSet}
          style={{
            border: '1px solid #ccc',
          }}
        />
      </div>
    );
  } else {
    const { src, srcSet } = getResponsiveImageUrlsForLimitFit(cld, image.publicId, 638, 359);
    return <img alt={image.alt ?? ''} src={src} srcSet={srcSet} />;
  }
}

interface FeedRenderContext {
  entities: Record<string, AppPublishedEntity>;
}

function FeedRichTextRenderer({
  richText,
  entities,
}: {
  richText: RichText;
  entities: Record<string, AppPublishedEntity>;
}) {
  const context: FeedRenderContext = { entities };
  const rendered = renderNode(context, richText.root, null);
  return rendered as JSX.Element;
}

function renderNode(context: FeedRenderContext, node: RichTextNode, key: Key | null): ReactNode {
  if (isRichTextRootNode(node)) {
    return renderChildren(context, node);
  }
  if (isRichTextLineBreakNode(node)) {
    return <br key={key} />;
  }

  if (isRichTextCodeNode(node)) {
    return <code key={key}>{renderChildren(context, node)}</code>;
  }

  if (isRichTextCodeHighlightNode(node)) {
    return node.text;
  }

  if (isRichTextParagraphNode(node)) {
    return <p key={key}>{renderChildren(context, node)}</p>;
  }

  if (isRichTextTextNode(node)) {
    let formattedText: ReactNode = node.text;
    if (richTextTextNodeHasFormat(node, 'bold')) {
      formattedText = <strong key={key}>{formattedText}</strong>;
    }
    if (richTextTextNodeHasFormat(node, 'code')) {
      formattedText = <code key={key}>{formattedText}</code>;
    }
    return formattedText;
  }

  if (isRichTextEntityLinkNode(node)) {
    const entity = context.entities[node.reference.id];
    if (entity) {
      if (isPublishedGlossaryTerm(entity)) {
        const description = richTextToPlainText(entity.fields.description);
        return (
          <a key={key} href={BrowserUrls.glossaryTerm(entity.fields.slug)} title={description}>
            {renderChildren(context, node)}
          </a>
        );
      } else if (isPublishedArticle(entity)) {
        return (
          <a key={key} href={BrowserUrls.article(entity.fields.slug)}>
            {renderChildren(context, node)}
          </a>
        );
      }
    }
  }

  if (isRichTextHeadingNode(node)) {
    const HeadingTag = node.tag;
    return <HeadingTag key={key}>{renderChildren(context, node)}</HeadingTag>;
  }

  if (isRichTextLinkNode(node)) {
    return (
      <a key={key} href={node.url}>
        {renderChildren(context, node)}
      </a>
    );
  }

  if (isRichTextListNode(node)) {
    const Tag = node.tag === 'ol' ? 'ol' : 'ul';
    return <Tag key={key}>{renderChildren(context, node)}</Tag>;
  }

  if (isRichTextListItemNode(node)) {
    return <li key={key}>{renderChildren(context, node)}</li>;
  }

  if (isRichTextValueItemNode(node)) {
    if (isPublishedCloudinaryImage(node.data)) {
      return <FeedCloudinaryImage key={key} image={node.data} height={400} />;
    }
  }

  // fallback for unknown element nodes
  if (isRichTextElementNode(node)) {
    return renderChildren(context, node);
  }
  return null;
}

function renderChildren(context: FeedRenderContext, node: RichTextElementNode): ReactNode[] {
  return node.children.map((child, index) => renderNode(context, child, index));
}

function richTextToPlainText(richText: RichText): string {
  function visitNode(node: RichTextNode): string {
    if (isRichTextTextNode(node)) {
      return node.text;
    }
    if (isRichTextElementNode(node)) {
      return node.children.map(visitNode).join('');
    }
    return '';
  }
  return visitNode(richText.root);
}

async function main() {
  console.log('Starting generating atom feed...');
  const { server } = (await initializeServer()).valueOrThrow();
  try {
    const authResult = await server.createSession(SYSTEM_USERS.serverRenderer);
    const publishedClient = server
      .createPublishedClient<AppPublishedClient>(async () => authResult)
      .toExceptionClient();

    const atomFeed = await generateAtomFeed(publishedClient);
    const filename = 'public/atom.xml';
    await writeFile(filename, atomFeed, { encoding: 'utf8' });
    console.log('Wrote to', filename);
    console.log('Done!');
  } finally {
    await server.shutdown();
  }
}

main();
