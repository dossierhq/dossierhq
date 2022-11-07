// Not using Deno types since it interferes with the Node types.
// This isn't a complete/correct definition of the Deno API, but it's enough for our purposes.

declare global {
  const Deno: DenoGlobal | undefined;
}

export interface DenoGlobal {
  args: string[];
  isatty(rid: number): boolean;
  run(options: {
    cmd: string[];
    cwd?: string;
    stdin?: 'piped' | undefined;
    stdout?: 'piped' | undefined;
  }): {
    close: () => Promise<void>;
    stdin: { write(input: Uint8Array): Promise<void>; close(): Promise<void> };
    output: () => Promise<Uint8Array>;
    status: () => Promise<{ success: boolean; code: number }>;
  };
  stdout: { readonly rid: number; writeSync(data: Uint8Array): void };
}
