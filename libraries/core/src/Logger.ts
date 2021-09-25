// Formatting placeholders compatible with node and pino: %s %d %O
// https://nodejs.org/api/util.html#util_util_format_format_args
// https://github.com/pinojs/pino/blob/master/docs/api.md#message

export interface Logger {
  /**
   * @param message Message with printf formatting (%s, %d, %O)
   * @param args Arguments to formatting
   */
  error(message: string, ...args: unknown[]): void;
  /**
   * @param message Message with printf formatting (%s, %d, %O)
   * @param args Arguments to formatting
   */
  warn(message: string, ...args: unknown[]): void;
  /**
   * @param message Message with printf formatting (%s, %d, %O)
   * @param args Arguments to formatting
   */
  info(message: string, ...args: unknown[]): void;
  /**
   * @param message Message with printf formatting (%s, %d, %O)
   * @param args Arguments to formatting
   */
  debug(message: string, ...args: unknown[]): void;
}
