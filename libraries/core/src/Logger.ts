export interface Logger {
  /**
   * @param message Message with formatting (e.g. %s, %d, %O)
   * @param args Arguments to formatting
   */
  error(message: string, ...args: unknown[]): void;
  /**
   * @param message Message with formatting (e.g. %s, %d, %O)
   * @param args Arguments to formatting
   */
  warn(message: string, ...args: unknown[]): void;
  /**
   * @param message Message with formatting (e.g. %s, %d, %O)
   * @param args Arguments to formatting
   */
  info(message: string, ...args: unknown[]): void;
  /**
   * @param message Message with formatting (e.g. %s, %d, %O)
   * @param args Arguments to formatting
   */
  debug(message: string, ...args: unknown[]): void;
}
