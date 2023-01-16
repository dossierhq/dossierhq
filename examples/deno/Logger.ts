import { Logger } from "@dossierhq/core";
import * as log from "std/log/mod.ts";
import { sprintf } from "std/fmt/printf.ts";

function formatLogMessage(message: string, args: unknown[]) {
  return sprintf(message.replaceAll("%O", "%#v"), ...args);
}

export function getLogger(name?: string): Logger {
  const logger = log.getLogger(name);
  const wrapper: Logger = {
    error(message, ...args) {
      logger.error(formatLogMessage(message, args));
    },
    warn(message, ...args) {
      logger.warning(formatLogMessage(message, args));
    },
    info(message, ...args) {
      logger.info(formatLogMessage(message, args));
    },
    debug(message, ...args) {
      logger.debug(formatLogMessage(message, args));
    },
  };
  return wrapper;
}
