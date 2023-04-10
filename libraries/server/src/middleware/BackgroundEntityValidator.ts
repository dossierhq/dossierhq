import {
  AdminClientOperationName,
  type AdminClient,
  type AdminClientOperation,
  type ClientContext,
  type Logger,
  type OkFromResult,
  type PublishedClientOperation,
} from '@dossierhq/core';
import type { Server } from '../Server.js';

const TIME_SINCE_LAST_OPERATION_MS = 1000 * 2;
const TIME_SINCE_LAST_REVALIDATION_MS = 5;

export class BackgroundEntityValidator<TContext extends ClientContext> {
  private server: Server;
  private logger: Logger;
  private handle: NodeJS.Timeout | null = null;
  private lastOperationTimestamp = 0;
  private revalidate = false;

  constructor(server: Server, logger: Logger) {
    this.server = server;
    this.logger = logger;

    this.tick = this.tick.bind(this);
    this.adminMiddleware = this.adminMiddleware.bind(this);
    this.publishedMiddleware = this.publishedMiddleware.bind(this);
  }

  start() {
    this.logger.info('BackgroundEntityValidator starting');
    this.revalidate = true;
    if (this.handle) {
      clearTimeout(this.handle);
    }
    this.handle = setTimeout(this.tick, TIME_SINCE_LAST_OPERATION_MS);
  }

  stop() {
    this.logger.info('BackgroundEntityValidator stopping');
    if (this.handle) {
      clearTimeout(this.handle);
      this.handle = null;
    }
  }

  async adminMiddleware(_context: TContext, operation: AdminClientOperation) {
    this.lastOperationTimestamp = Date.now();

    const result = await operation.next();
    if (operation.name === AdminClientOperationName.updateSchemaSpecification && result.isOk()) {
      const payload = result.value as OkFromResult<
        ReturnType<AdminClient['updateSchemaSpecification']>
      >;
      if (payload.effect === 'updated') {
        this.revalidate = true;
        if (!this.handle) {
          this.logger.info('BackgroundEntityValidator starting revalidation after schema update');
          this.handle = setTimeout(this.tick, TIME_SINCE_LAST_OPERATION_MS);
        }
      }
    }
    operation.resolve(result);
  }

  async publishedMiddleware(_context: TContext, operation: PublishedClientOperation) {
    this.lastOperationTimestamp = Date.now();

    const result = await operation.next();
    operation.resolve(result);
  }

  private async tick() {
    this.handle = null;

    const timeSinceLastOperation = Date.now() - this.lastOperationTimestamp;
    if (timeSinceLastOperation < TIME_SINCE_LAST_OPERATION_MS) {
      this.handle = setTimeout(this.tick, TIME_SINCE_LAST_OPERATION_MS - timeSinceLastOperation);
      return;
    }

    if (this.revalidate) {
      const result = await this.server.revalidateNextEntity();
      if (result.isOk()) {
        if (result.value) {
          if (result.value.valid) {
            this.logger.info('BackgroundEntityValidator revalidated entity: %s', result.value.id);
          } else {
            this.logger.warn(
              'BackgroundEntityValidator revalidated entity: %s, but it was invalid',
              result.value.id
            );
          }
        } else {
          this.logger.info('BackgroundEntityValidator no more entities to revalidate');
          this.revalidate = false;
        }
      } else {
        this.logger.error(
          'BackgroundEntityValidator failed validating %s: %s',
          result.error,
          result.message
        );
      }
    }

    if (this.revalidate) {
      this.handle = setTimeout(this.tick, TIME_SINCE_LAST_REVALIDATION_MS);
    }
  }
}
