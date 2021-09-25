import type { Logger, PublishingEventKind, Schema } from '@jonasb/datadata-core';
import type { Temporal } from '@js-temporal/polyfill';
import { InMemoryServerInner } from './InMemoryServerInner';

export interface InMemoryEntity {
  id: string;
  type: string;
  name: string;
  versions: InMemoryEntityVersion[];
  createdAt: Temporal.Instant;
  updatedAt: Temporal.Instant;
  archived?: boolean;
  publishedVersion?: number | null;
  history: { version: number; createdBy: string; createdAt: Temporal.Instant }[];
  publishEvents: {
    kind: PublishingEventKind;
    version: number | null;
    publishedBy: string;
    publishedAt: Temporal.Instant;
  }[];
}

export interface InMemoryEntityVersion {
  _version: number;
  [fieldName: string]: unknown;
}

export interface JsonInMemoryEntity
  extends Omit<InMemoryEntity, 'createdAt' | 'updatedAt' | 'history' | 'publishEvents'> {
  history: { version: number; createdBy: string; createdAt: string }[];
  publishEvents: {
    kind: PublishingEventKind;
    version: number | null;
    publishedBy: string;
    publishedAt: string;
  }[];
}

export interface InMemorySessionContext {
  logger: Logger;
  server: InMemoryServerInner;
  subjectId: string;
}

export class InMemoryServer {
  #inner: InMemoryServerInner;

  get schema(): Schema {
    return this.#inner.schema;
  }

  constructor(schema: Schema) {
    this.#inner = new InMemoryServerInner(schema);
  }

  createContext(subjectId: string): InMemorySessionContext {
    const noop = () => {
      // no-op
    };
    const logger: Logger = {
      error: noop,
      warn: noop,
      info: noop,
      debug: noop,
    };
    return { logger, server: this.#inner, subjectId };
  }

  loadEntities(entities: JsonInMemoryEntity[]): void {
    this.#inner.loadEntities(entities);
  }
}
