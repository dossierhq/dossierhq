import type {
  EntityReference,
  PublishedClient,
  PublishedEntity,
  RichText,
  ValueItem,
} from '@jonasb/datadata-core';

export type AppPublishedClient = PublishedClient<AllPublishedEntities>;

export type AllPublishedEntities = PublishedArticle | PublishedChapter | PublishedGlossaryTerm;

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

export type AllPublishedValueItems = PublishedArticleTocItem | PublishedTocItem;

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
