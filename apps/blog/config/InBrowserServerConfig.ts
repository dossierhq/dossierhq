function emptyMeansNull(value: string | undefined): string | null {
  return value ? value : null;
}

export const IN_BROWSER_DATABASE_URL = emptyMeansNull(
  process.env.NEXT_PUBLIC_IN_BROWSER_DATABASE_URL
);
