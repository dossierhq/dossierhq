declare global {
  const Deno: DenoGlobal | undefined;
}

export interface DenoGlobal {
  args: string[];
  isatty(rid: number): boolean;
  stdout: { readonly rid: number; writeSync(data: Uint8Array): void };
}
