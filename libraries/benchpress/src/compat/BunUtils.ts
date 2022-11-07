// Not using bun-types since it interferes with the Node types.
// This isn't a complete/correct definition of the Bun API, but it's enough for our purposes.

declare global {
  const Bun: BunGlobal | undefined;
}

export interface BunGlobal {
  spawnSync(options: { cmd: string[]; cwd?: string; stdin?: Uint8Array }): {
    stdout?: Buffer;
  };
  which(file: string): string | null;
  write(a: unknown, b: unknown): void;
  stdout: unknown;
}
