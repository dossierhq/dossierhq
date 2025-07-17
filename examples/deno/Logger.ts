import { Logger } from "@dossierhq/core";
import * as log from "std/log/mod.ts";

export function getLogger(name?: string): Logger {
  const logger = log.getLogger(name);
  const wrapper: Logger = {
    error(message: string, data?: unknown): void {
      logger.error(message, data);
    },
    warn(message: string, data?: unknown): void {
      logger.warning(message, data);
    },
    info(message: string, data?: unknown): void {
      logger.info(message, data);
    },
    debug(message: string, data?: unknown): void {
      logger.debug(message, data);
    },
  };
  return wrapper;
}
