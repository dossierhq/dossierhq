import type {
  Component,
  DossierClient,
  DossierExceptionClient,
  Entity,
  EntityReference,
  PublishedClient,
  PublishedEntity,
  PublishedExceptionClient,
  RichText,
} from '@dossierhq/core';

export type AppAdminClient = DossierClient<
  AppEntity,
  AppComponent,
  AppUniqueIndexes,
  AppAdminExceptionClient
>;

export type AppAdminExceptionClient = DossierExceptionClient<
  AppEntity,
  AppComponent,
  AppUniqueIndexes
>;

export type AppUniqueIndexes = 'articleSlug' | 'blogSlug' | 'glossarySlug';

export type AppEntity = Article | Author | BlogPost | Chapter | GlossaryTerm;

export interface ArticleFields {
  title: string | null;
  slug: string | null;
  description: string | null;
  body: RichText | null;
}

export type Article = Entity<'Article', ArticleFields, ''>;

export function isArticle(entity: Entity<string, object>): entity is Article {
  return entity.info.type === 'Article';
}

export function assertIsArticle(entity: Entity<string, object>): asserts entity is Article {
  if (entity.info.type !== 'Article') {
    throw new Error('Expected info.type = Article (but was ' + entity.info.type + ')');
  }
}

export interface AuthorFields {
  name: string | null;
}

export type Author = Entity<'Author', AuthorFields, ''>;

export function isAuthor(entity: Entity<string, object>): entity is Author {
  return entity.info.type === 'Author';
}

export function assertIsAuthor(entity: Entity<string, object>): asserts entity is Author {
  if (entity.info.type !== 'Author') {
    throw new Error('Expected info.type = Author (but was ' + entity.info.type + ')');
  }
}

export interface BlogPostFields {
  title: string | null;
  slug: string | null;
  publishedDate: string | null;
  updatedDate: string | null;
  authors: EntityReference[] | null;
  hero: CloudinaryImage | null;
  description: string | null;
  body: RichText | null;
}

export type BlogPost = Entity<'BlogPost', BlogPostFields, ''>;

export function isBlogPost(entity: Entity<string, object>): entity is BlogPost {
  return entity.info.type === 'BlogPost';
}

export function assertIsBlogPost(entity: Entity<string, object>): asserts entity is BlogPost {
  if (entity.info.type !== 'BlogPost') {
    throw new Error('Expected info.type = BlogPost (but was ' + entity.info.type + ')');
  }
}

export interface ChapterFields {
  items: (ArticleTocItem | TocItem)[] | null;
}

export type Chapter = Entity<'Chapter', ChapterFields, ''>;

export function isChapter(entity: Entity<string, object>): entity is Chapter {
  return entity.info.type === 'Chapter';
}

export function assertIsChapter(entity: Entity<string, object>): asserts entity is Chapter {
  if (entity.info.type !== 'Chapter') {
    throw new Error('Expected info.type = Chapter (but was ' + entity.info.type + ')');
  }
}

export interface GlossaryTermFields {
  title: string | null;
  slug: string | null;
  description: RichText | null;
}

export type GlossaryTerm = Entity<'GlossaryTerm', GlossaryTermFields, ''>;

export function isGlossaryTerm(entity: Entity<string, object>): entity is GlossaryTerm {
  return entity.info.type === 'GlossaryTerm';
}

export function assertIsGlossaryTerm(
  entity: Entity<string, object>,
): asserts entity is GlossaryTerm {
  if (entity.info.type !== 'GlossaryTerm') {
    throw new Error('Expected info.type = GlossaryTerm (but was ' + entity.info.type + ')');
  }
}

export type AppComponent = ArticleTocItem | CloudinaryImage | CodapiSnippet | TocItem;

export interface ArticleTocItemFields {
  title: string | null;
  article: EntityReference | null;
}

export type ArticleTocItem = Component<'ArticleTocItem', ArticleTocItemFields>;

export function isArticleTocItem(
  component: Component<string, object> | ArticleTocItem,
): component is ArticleTocItem {
  return component.type === 'ArticleTocItem';
}

export function assertIsArticleTocItem(
  component: Component<string, object> | ArticleTocItem,
): asserts component is ArticleTocItem {
  if (component.type !== 'ArticleTocItem') {
    throw new Error('Expected type = ArticleTocItem (but was ' + component.type + ')');
  }
}

export interface CloudinaryImageFields {
  publicId: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
}

export type CloudinaryImage = Component<'CloudinaryImage', CloudinaryImageFields>;

export function isCloudinaryImage(
  component: Component<string, object> | CloudinaryImage,
): component is CloudinaryImage {
  return component.type === 'CloudinaryImage';
}

export function assertIsCloudinaryImage(
  component: Component<string, object> | CloudinaryImage,
): asserts component is CloudinaryImage {
  if (component.type !== 'CloudinaryImage') {
    throw new Error('Expected type = CloudinaryImage (but was ' + component.type + ')');
  }
}

export interface CodapiSnippetFields {
  id: string | null;
  dependsOn: string | null;
  code: string | null;
}

export type CodapiSnippet = Component<'CodapiSnippet', CodapiSnippetFields>;

export function isCodapiSnippet(
  component: Component<string, object> | CodapiSnippet,
): component is CodapiSnippet {
  return component.type === 'CodapiSnippet';
}

export function assertIsCodapiSnippet(
  component: Component<string, object> | CodapiSnippet,
): asserts component is CodapiSnippet {
  if (component.type !== 'CodapiSnippet') {
    throw new Error('Expected type = CodapiSnippet (but was ' + component.type + ')');
  }
}

export interface TocItemFields {
  title: string | null;
  items: (ArticleTocItem | TocItem)[] | null;
}

export type TocItem = Component<'TocItem', TocItemFields>;

export function isTocItem(component: Component<string, object> | TocItem): component is TocItem {
  return component.type === 'TocItem';
}

export function assertIsTocItem(
  component: Component<string, object> | TocItem,
): asserts component is TocItem {
  if (component.type !== 'TocItem') {
    throw new Error('Expected type = TocItem (but was ' + component.type + ')');
  }
}

export type AppPublishedClient = PublishedClient<
  AppPublishedEntity,
  AppPublishedComponent,
  AppPublishedUniqueIndexes,
  AppPublishedExceptionClient
>;

export type AppPublishedExceptionClient = PublishedExceptionClient<
  AppPublishedEntity,
  AppPublishedComponent,
  AppPublishedUniqueIndexes
>;

export type AppPublishedUniqueIndexes = 'articleSlug' | 'blogSlug' | 'glossarySlug';

export type AppPublishedEntity =
  | PublishedArticle
  | PublishedAuthor
  | PublishedBlogPost
  | PublishedChapter
  | PublishedGlossaryTerm;

export interface PublishedArticleFields {
  title: string;
  slug: string;
  description: string;
  body: RichText;
}

export type PublishedArticle = PublishedEntity<'Article', PublishedArticleFields, ''>;

export function isPublishedArticle(
  entity: PublishedEntity<string, object>,
): entity is PublishedArticle {
  return entity.info.type === 'Article';
}

export function assertIsPublishedArticle(
  entity: PublishedEntity<string, object>,
): asserts entity is PublishedArticle {
  if (entity.info.type !== 'Article') {
    throw new Error('Expected info.type = Article (but was ' + entity.info.type + ')');
  }
}

export interface PublishedAuthorFields {
  name: string;
}

export type PublishedAuthor = PublishedEntity<'Author', PublishedAuthorFields, ''>;

export function isPublishedAuthor(
  entity: PublishedEntity<string, object>,
): entity is PublishedAuthor {
  return entity.info.type === 'Author';
}

export function assertIsPublishedAuthor(
  entity: PublishedEntity<string, object>,
): asserts entity is PublishedAuthor {
  if (entity.info.type !== 'Author') {
    throw new Error('Expected info.type = Author (but was ' + entity.info.type + ')');
  }
}

export interface PublishedBlogPostFields {
  title: string;
  slug: string;
  publishedDate: string;
  updatedDate: string | null;
  authors: EntityReference[] | null;
  hero: PublishedCloudinaryImage;
  description: string;
  body: RichText;
}

export type PublishedBlogPost = PublishedEntity<'BlogPost', PublishedBlogPostFields, ''>;

export function isPublishedBlogPost(
  entity: PublishedEntity<string, object>,
): entity is PublishedBlogPost {
  return entity.info.type === 'BlogPost';
}

export function assertIsPublishedBlogPost(
  entity: PublishedEntity<string, object>,
): asserts entity is PublishedBlogPost {
  if (entity.info.type !== 'BlogPost') {
    throw new Error('Expected info.type = BlogPost (but was ' + entity.info.type + ')');
  }
}

export interface PublishedChapterFields {
  items: (PublishedArticleTocItem | PublishedTocItem)[];
}

export type PublishedChapter = PublishedEntity<'Chapter', PublishedChapterFields, ''>;

export function isPublishedChapter(
  entity: PublishedEntity<string, object>,
): entity is PublishedChapter {
  return entity.info.type === 'Chapter';
}

export function assertIsPublishedChapter(
  entity: PublishedEntity<string, object>,
): asserts entity is PublishedChapter {
  if (entity.info.type !== 'Chapter') {
    throw new Error('Expected info.type = Chapter (but was ' + entity.info.type + ')');
  }
}

export interface PublishedGlossaryTermFields {
  title: string;
  slug: string;
  description: RichText;
}

export type PublishedGlossaryTerm = PublishedEntity<
  'GlossaryTerm',
  PublishedGlossaryTermFields,
  ''
>;

export function isPublishedGlossaryTerm(
  entity: PublishedEntity<string, object>,
): entity is PublishedGlossaryTerm {
  return entity.info.type === 'GlossaryTerm';
}

export function assertIsPublishedGlossaryTerm(
  entity: PublishedEntity<string, object>,
): asserts entity is PublishedGlossaryTerm {
  if (entity.info.type !== 'GlossaryTerm') {
    throw new Error('Expected info.type = GlossaryTerm (but was ' + entity.info.type + ')');
  }
}

export type AppPublishedComponent =
  | PublishedArticleTocItem
  | PublishedCloudinaryImage
  | PublishedCodapiSnippet
  | PublishedTocItem;

export interface PublishedArticleTocItemFields {
  title: string;
  article: EntityReference;
}

export type PublishedArticleTocItem = Component<'ArticleTocItem', PublishedArticleTocItemFields>;

export function isPublishedArticleTocItem(
  component: Component<string, object> | PublishedArticleTocItem,
): component is PublishedArticleTocItem {
  return component.type === 'ArticleTocItem';
}

export function assertIsPublishedArticleTocItem(
  component: Component<string, object> | PublishedArticleTocItem,
): asserts component is PublishedArticleTocItem {
  if (component.type !== 'ArticleTocItem') {
    throw new Error('Expected type = ArticleTocItem (but was ' + component.type + ')');
  }
}

export interface PublishedCloudinaryImageFields {
  publicId: string;
  width: number;
  height: number;
  alt: string | null;
}

export type PublishedCloudinaryImage = Component<'CloudinaryImage', PublishedCloudinaryImageFields>;

export function isPublishedCloudinaryImage(
  component: Component<string, object> | PublishedCloudinaryImage,
): component is PublishedCloudinaryImage {
  return component.type === 'CloudinaryImage';
}

export function assertIsPublishedCloudinaryImage(
  component: Component<string, object> | PublishedCloudinaryImage,
): asserts component is PublishedCloudinaryImage {
  if (component.type !== 'CloudinaryImage') {
    throw new Error('Expected type = CloudinaryImage (but was ' + component.type + ')');
  }
}

export interface PublishedCodapiSnippetFields {
  id: string | null;
  dependsOn: string | null;
  code: string;
}

export type PublishedCodapiSnippet = Component<'CodapiSnippet', PublishedCodapiSnippetFields>;

export function isPublishedCodapiSnippet(
  component: Component<string, object> | PublishedCodapiSnippet,
): component is PublishedCodapiSnippet {
  return component.type === 'CodapiSnippet';
}

export function assertIsPublishedCodapiSnippet(
  component: Component<string, object> | PublishedCodapiSnippet,
): asserts component is PublishedCodapiSnippet {
  if (component.type !== 'CodapiSnippet') {
    throw new Error('Expected type = CodapiSnippet (but was ' + component.type + ')');
  }
}

export interface PublishedTocItemFields {
  title: string;
  items: (PublishedArticleTocItem | PublishedTocItem)[];
}

export type PublishedTocItem = Component<'TocItem', PublishedTocItemFields>;

export function isPublishedTocItem(
  component: Component<string, object> | PublishedTocItem,
): component is PublishedTocItem {
  return component.type === 'TocItem';
}

export function assertIsPublishedTocItem(
  component: Component<string, object> | PublishedTocItem,
): asserts component is PublishedTocItem {
  if (component.type !== 'TocItem') {
    throw new Error('Expected type = TocItem (but was ' + component.type + ')');
  }
}
