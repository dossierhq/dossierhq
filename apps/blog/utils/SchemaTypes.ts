import type { PublishedEntity, RichText } from '@jonasb/datadata-core';

export interface PublishedArticleFields {
  title: string;
  slug: string;
  body: RichText;
}

export type PublishedArticle = PublishedEntity<'Article', PublishedArticleFields>;

export function isPublishedArticle(
  entity: PublishedEntity | PublishedArticle
): entity is PublishedArticle {
  return entity.info.type === 'Article';
}

export function assertIsPublishedArticle(
  entity: PublishedEntity | PublishedArticle
): asserts entity is PublishedArticle {
  if (entity.info.type !== 'Article') {
    throw new Error('Expected info.type = Article (but was ' + entity.info.type + ')');
  }
}

export interface PublishedGlossaryTermFields {
  title: string;
  slug: string;
  description: RichText;
}

export type PublishedGlossaryTerm = PublishedEntity<'GlossaryTerm', PublishedGlossaryTermFields>;

export function isPublishedGlossaryTerm(
  entity: PublishedEntity | PublishedGlossaryTerm
): entity is PublishedGlossaryTerm {
  return entity.info.type === 'GlossaryTerm';
}

export function assertIsPublishedGlossaryTerm(
  entity: PublishedEntity | PublishedGlossaryTerm
): asserts entity is PublishedGlossaryTerm {
  if (entity.info.type !== 'GlossaryTerm') {
    throw new Error('Expected info.type = GlossaryTerm (but was ' + entity.info.type + ')');
  }
}

export type AllPublishedValueItems = never;
