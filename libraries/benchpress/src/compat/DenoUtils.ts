// Not using Deno types since it interferes with the Node types.
// This isn't a complete/correct definition of the Deno API, but it's enough for our purposes.

declare global {
  const Deno: DenoGlobal | undefined;
}

export interface DenoGlobal {
  args: string[];
  stdout: { writeSync(data: Uint8Array): void; isTerminal(): boolean };
}
