import type {
  AdminClient,
  AdminExceptionClient,
  Component,
  Entity,
  EntityReference,
  PublishedClient,
  PublishedEntity,
  PublishedExceptionClient,
  RichText,
} from '@dossierhq/core';

export type AppAdminClient = AdminClient<
  AppAdminEntity,
  AppAdminComponent,
  AppAdminUniqueIndexes,
  AppAdminExceptionClient
>;

export type AppAdminExceptionClient = AdminExceptionClient<
  AppAdminEntity,
  AppAdminComponent,
  AppAdminUniqueIndexes
>;

export type AppAdminUniqueIndexes = 'articleSlug' | 'blogSlug' | 'glossarySlug';

export type AppAdminEntity =
  | AdminArticle
  | AdminAuthor
  | AdminBlogPost
  | AdminChapter
  | AdminGlossaryTerm;

export interface AdminArticleFields {
  title: string | null;
  slug: string | null;
  description: string | null;
  body: RichText | null;
}

export type AdminArticle = Entity<'Article', AdminArticleFields, ''>;

export function isAdminArticle(entity: Entity<string, object>): entity is AdminArticle {
  return entity.info.type === 'Article';
}

export function assertIsAdminArticle(
  entity: Entity<string, object>,
): asserts entity is AdminArticle {
  if (entity.info.type !== 'Article') {
    throw new Error('Expected info.type = Article (but was ' + entity.info.type + ')');
  }
}

export interface AdminAuthorFields {
  name: string | null;
}

export type AdminAuthor = Entity<'Author', AdminAuthorFields, ''>;

export function isAdminAuthor(entity: Entity<string, object>): entity is AdminAuthor {
  return entity.info.type === 'Author';
}

export function assertIsAdminAuthor(entity: Entity<string, object>): asserts entity is AdminAuthor {
  if (entity.info.type !== 'Author') {
    throw new Error('Expected info.type = Author (but was ' + entity.info.type + ')');
  }
}

export interface AdminBlogPostFields {
  title: string | null;
  slug: string | null;
  publishedDate: string | null;
  updatedDate: string | null;
  authors: EntityReference[] | null;
  hero: AdminCloudinaryImage | null;
  description: string | null;
  body: RichText | null;
}

export type AdminBlogPost = Entity<'BlogPost', AdminBlogPostFields, ''>;

export function isAdminBlogPost(entity: Entity<string, object>): entity is AdminBlogPost {
  return entity.info.type === 'BlogPost';
}

export function assertIsAdminBlogPost(
  entity: Entity<string, object>,
): asserts entity is AdminBlogPost {
  if (entity.info.type !== 'BlogPost') {
    throw new Error('Expected info.type = BlogPost (but was ' + entity.info.type + ')');
  }
}

export interface AdminChapterFields {
  items: (AdminArticleTocItem | AdminTocItem)[] | null;
}

export type AdminChapter = Entity<'Chapter', AdminChapterFields, ''>;

export function isAdminChapter(entity: Entity<string, object>): entity is AdminChapter {
  return entity.info.type === 'Chapter';
}

export function assertIsAdminChapter(
  entity: Entity<string, object>,
): asserts entity is AdminChapter {
  if (entity.info.type !== 'Chapter') {
    throw new Error('Expected info.type = Chapter (but was ' + entity.info.type + ')');
  }
}

export interface AdminGlossaryTermFields {
  title: string | null;
  slug: string | null;
  description: RichText | null;
}

export type AdminGlossaryTerm = Entity<'GlossaryTerm', AdminGlossaryTermFields, ''>;

export function isAdminGlossaryTerm(entity: Entity<string, object>): entity is AdminGlossaryTerm {
  return entity.info.type === 'GlossaryTerm';
}

export function assertIsAdminGlossaryTerm(
  entity: Entity<string, object>,
): asserts entity is AdminGlossaryTerm {
  if (entity.info.type !== 'GlossaryTerm') {
    throw new Error('Expected info.type = GlossaryTerm (but was ' + entity.info.type + ')');
  }
}

export type AppAdminComponent =
  | AdminArticleTocItem
  | AdminCloudinaryImage
  | AdminCodapiSnippet
  | AdminTocItem;

export interface AdminArticleTocItemFields {
  title: string | null;
  article: EntityReference | null;
}

export type AdminArticleTocItem = Component<'ArticleTocItem', AdminArticleTocItemFields>;

export function isAdminArticleTocItem(
  component: Component<string, object> | AdminArticleTocItem,
): component is AdminArticleTocItem {
  return component.type === 'ArticleTocItem';
}

export function assertIsAdminArticleTocItem(
  component: Component<string, object> | AdminArticleTocItem,
): asserts component is AdminArticleTocItem {
  if (component.type !== 'ArticleTocItem') {
    throw new Error('Expected type = ArticleTocItem (but was ' + component.type + ')');
  }
}

export interface AdminCloudinaryImageFields {
  publicId: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
}

export type AdminCloudinaryImage = Component<'CloudinaryImage', AdminCloudinaryImageFields>;

export function isAdminCloudinaryImage(
  component: Component<string, object> | AdminCloudinaryImage,
): component is AdminCloudinaryImage {
  return component.type === 'CloudinaryImage';
}

export function assertIsAdminCloudinaryImage(
  component: Component<string, object> | AdminCloudinaryImage,
): asserts component is AdminCloudinaryImage {
  if (component.type !== 'CloudinaryImage') {
    throw new Error('Expected type = CloudinaryImage (but was ' + component.type + ')');
  }
}

export interface AdminCodapiSnippetFields {
  id: string | null;
  dependsOn: string | null;
  code: string | null;
}

export type AdminCodapiSnippet = Component<'CodapiSnippet', AdminCodapiSnippetFields>;

export function isAdminCodapiSnippet(
  component: Component<string, object> | AdminCodapiSnippet,
): component is AdminCodapiSnippet {
  return component.type === 'CodapiSnippet';
}

export function assertIsAdminCodapiSnippet(
  component: Component<string, object> | AdminCodapiSnippet,
): asserts component is AdminCodapiSnippet {
  if (component.type !== 'CodapiSnippet') {
    throw new Error('Expected type = CodapiSnippet (but was ' + component.type + ')');
  }
}

export interface AdminTocItemFields {
  title: string | null;
  items: (AdminArticleTocItem | AdminTocItem)[] | null;
}

export type AdminTocItem = Component<'TocItem', AdminTocItemFields>;

export function isAdminTocItem(
  component: Component<string, object> | AdminTocItem,
): component is AdminTocItem {
  return component.type === 'TocItem';
}

export function assertIsAdminTocItem(
  component: Component<string, object> | AdminTocItem,
): asserts component is AdminTocItem {
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
