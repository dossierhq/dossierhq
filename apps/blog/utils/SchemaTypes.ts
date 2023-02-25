import type {
  AdminClient,
  AdminEntity,
  AdminExceptionClient,
  EntityReference,
  PublishedClient,
  PublishedEntity,
  PublishedExceptionClient,
  RichText,
  ValueItem,
} from '@dossierhq/core';

export type AppAdminClient = AdminClient<
  AppAdminEntity,
  AppAdminUniqueIndexes,
  AppAdminExceptionClient
>;

export type AppAdminExceptionClient = AdminExceptionClient<AppAdminEntity, AppAdminUniqueIndexes>;

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
  body: RichText | null;
}

export type AdminArticle = AdminEntity<'Article', AdminArticleFields, string>;

export function isAdminArticle(entity: AdminEntity<string, object>): entity is AdminArticle {
  return entity.info.type === 'Article';
}

export function assertIsAdminArticle(
  entity: AdminEntity<string, object>
): asserts entity is AdminArticle {
  if (entity.info.type !== 'Article') {
    throw new Error('Expected info.type = Article (but was ' + entity.info.type + ')');
  }
}

export interface AdminAuthorFields {
  name: string | null;
}

export type AdminAuthor = AdminEntity<'Author', AdminAuthorFields, string>;

export function isAdminAuthor(entity: AdminEntity<string, object>): entity is AdminAuthor {
  return entity.info.type === 'Author';
}

export function assertIsAdminAuthor(
  entity: AdminEntity<string, object>
): asserts entity is AdminAuthor {
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

export type AdminBlogPost = AdminEntity<'BlogPost', AdminBlogPostFields, string>;

export function isAdminBlogPost(entity: AdminEntity<string, object>): entity is AdminBlogPost {
  return entity.info.type === 'BlogPost';
}

export function assertIsAdminBlogPost(
  entity: AdminEntity<string, object>
): asserts entity is AdminBlogPost {
  if (entity.info.type !== 'BlogPost') {
    throw new Error('Expected info.type = BlogPost (but was ' + entity.info.type + ')');
  }
}

export interface AdminChapterFields {
  items: Array<AdminArticleTocItem | AdminTocItem> | null;
}

export type AdminChapter = AdminEntity<'Chapter', AdminChapterFields, string>;

export function isAdminChapter(entity: AdminEntity<string, object>): entity is AdminChapter {
  return entity.info.type === 'Chapter';
}

export function assertIsAdminChapter(
  entity: AdminEntity<string, object>
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

export type AdminGlossaryTerm = AdminEntity<'GlossaryTerm', AdminGlossaryTermFields, string>;

export function isAdminGlossaryTerm(
  entity: AdminEntity<string, object>
): entity is AdminGlossaryTerm {
  return entity.info.type === 'GlossaryTerm';
}

export function assertIsAdminGlossaryTerm(
  entity: AdminEntity<string, object>
): asserts entity is AdminGlossaryTerm {
  if (entity.info.type !== 'GlossaryTerm') {
    throw new Error('Expected info.type = GlossaryTerm (but was ' + entity.info.type + ')');
  }
}

export type AppAdminValueItem = AdminArticleTocItem | AdminCloudinaryImage | AdminTocItem;

export interface AdminArticleTocItemFields {
  title: string | null;
  article: EntityReference | null;
}

export type AdminArticleTocItem = ValueItem<'ArticleTocItem', AdminArticleTocItemFields>;

export function isAdminArticleTocItem(
  valueItem: ValueItem<string, object> | AdminArticleTocItem
): valueItem is AdminArticleTocItem {
  return valueItem.type === 'ArticleTocItem';
}

export function assertIsAdminArticleTocItem(
  valueItem: ValueItem<string, object> | AdminArticleTocItem
): asserts valueItem is AdminArticleTocItem {
  if (valueItem.type !== 'ArticleTocItem') {
    throw new Error('Expected type = ArticleTocItem (but was ' + valueItem.type + ')');
  }
}

export interface AdminCloudinaryImageFields {
  publicId: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
}

export type AdminCloudinaryImage = ValueItem<'CloudinaryImage', AdminCloudinaryImageFields>;

export function isAdminCloudinaryImage(
  valueItem: ValueItem<string, object> | AdminCloudinaryImage
): valueItem is AdminCloudinaryImage {
  return valueItem.type === 'CloudinaryImage';
}

export function assertIsAdminCloudinaryImage(
  valueItem: ValueItem<string, object> | AdminCloudinaryImage
): asserts valueItem is AdminCloudinaryImage {
  if (valueItem.type !== 'CloudinaryImage') {
    throw new Error('Expected type = CloudinaryImage (but was ' + valueItem.type + ')');
  }
}

export interface AdminTocItemFields {
  title: string | null;
  items: Array<AdminArticleTocItem | AdminTocItem> | null;
}

export type AdminTocItem = ValueItem<'TocItem', AdminTocItemFields>;

export function isAdminTocItem(
  valueItem: ValueItem<string, object> | AdminTocItem
): valueItem is AdminTocItem {
  return valueItem.type === 'TocItem';
}

export function assertIsAdminTocItem(
  valueItem: ValueItem<string, object> | AdminTocItem
): asserts valueItem is AdminTocItem {
  if (valueItem.type !== 'TocItem') {
    throw new Error('Expected type = TocItem (but was ' + valueItem.type + ')');
  }
}

export type AppPublishedClient = PublishedClient<
  AppPublishedEntity,
  AppPublishedUniqueIndexes,
  AppPublishedExceptionClient
>;

export type AppPublishedExceptionClient = PublishedExceptionClient<
  AppPublishedEntity,
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
  body: RichText;
}

export type PublishedArticle = PublishedEntity<'Article', PublishedArticleFields, string>;

export function isPublishedArticle(
  entity: PublishedEntity<string, object>
): entity is PublishedArticle {
  return entity.info.type === 'Article';
}

export function assertIsPublishedArticle(
  entity: PublishedEntity<string, object>
): asserts entity is PublishedArticle {
  if (entity.info.type !== 'Article') {
    throw new Error('Expected info.type = Article (but was ' + entity.info.type + ')');
  }
}

export interface PublishedAuthorFields {
  name: string;
}

export type PublishedAuthor = PublishedEntity<'Author', PublishedAuthorFields, string>;

export function isPublishedAuthor(
  entity: PublishedEntity<string, object>
): entity is PublishedAuthor {
  return entity.info.type === 'Author';
}

export function assertIsPublishedAuthor(
  entity: PublishedEntity<string, object>
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

export type PublishedBlogPost = PublishedEntity<'BlogPost', PublishedBlogPostFields, string>;

export function isPublishedBlogPost(
  entity: PublishedEntity<string, object>
): entity is PublishedBlogPost {
  return entity.info.type === 'BlogPost';
}

export function assertIsPublishedBlogPost(
  entity: PublishedEntity<string, object>
): asserts entity is PublishedBlogPost {
  if (entity.info.type !== 'BlogPost') {
    throw new Error('Expected info.type = BlogPost (but was ' + entity.info.type + ')');
  }
}

export interface PublishedChapterFields {
  items: Array<PublishedArticleTocItem | PublishedTocItem>;
}

export type PublishedChapter = PublishedEntity<'Chapter', PublishedChapterFields, string>;

export function isPublishedChapter(
  entity: PublishedEntity<string, object>
): entity is PublishedChapter {
  return entity.info.type === 'Chapter';
}

export function assertIsPublishedChapter(
  entity: PublishedEntity<string, object>
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
  string
>;

export function isPublishedGlossaryTerm(
  entity: PublishedEntity<string, object>
): entity is PublishedGlossaryTerm {
  return entity.info.type === 'GlossaryTerm';
}

export function assertIsPublishedGlossaryTerm(
  entity: PublishedEntity<string, object>
): asserts entity is PublishedGlossaryTerm {
  if (entity.info.type !== 'GlossaryTerm') {
    throw new Error('Expected info.type = GlossaryTerm (but was ' + entity.info.type + ')');
  }
}

export type AppPublishedValueItem =
  | PublishedArticleTocItem
  | PublishedCloudinaryImage
  | PublishedTocItem;

export interface PublishedArticleTocItemFields {
  title: string;
  article: EntityReference;
}

export type PublishedArticleTocItem = ValueItem<'ArticleTocItem', PublishedArticleTocItemFields>;

export function isPublishedArticleTocItem(
  valueItem: ValueItem<string, object> | PublishedArticleTocItem
): valueItem is PublishedArticleTocItem {
  return valueItem.type === 'ArticleTocItem';
}

export function assertIsPublishedArticleTocItem(
  valueItem: ValueItem<string, object> | PublishedArticleTocItem
): asserts valueItem is PublishedArticleTocItem {
  if (valueItem.type !== 'ArticleTocItem') {
    throw new Error('Expected type = ArticleTocItem (but was ' + valueItem.type + ')');
  }
}

export interface PublishedCloudinaryImageFields {
  publicId: string;
  width: number;
  height: number;
  alt: string | null;
}

export type PublishedCloudinaryImage = ValueItem<'CloudinaryImage', PublishedCloudinaryImageFields>;

export function isPublishedCloudinaryImage(
  valueItem: ValueItem<string, object> | PublishedCloudinaryImage
): valueItem is PublishedCloudinaryImage {
  return valueItem.type === 'CloudinaryImage';
}

export function assertIsPublishedCloudinaryImage(
  valueItem: ValueItem<string, object> | PublishedCloudinaryImage
): asserts valueItem is PublishedCloudinaryImage {
  if (valueItem.type !== 'CloudinaryImage') {
    throw new Error('Expected type = CloudinaryImage (but was ' + valueItem.type + ')');
  }
}

export interface PublishedTocItemFields {
  title: string;
  items: Array<PublishedArticleTocItem | PublishedTocItem>;
}

export type PublishedTocItem = ValueItem<'TocItem', PublishedTocItemFields>;

export function isPublishedTocItem(
  valueItem: ValueItem<string, object> | PublishedTocItem
): valueItem is PublishedTocItem {
  return valueItem.type === 'TocItem';
}

export function assertIsPublishedTocItem(
  valueItem: ValueItem<string, object> | PublishedTocItem
): asserts valueItem is PublishedTocItem {
  if (valueItem.type !== 'TocItem') {
    throw new Error('Expected type = TocItem (but was ' + valueItem.type + ')');
  }
}
