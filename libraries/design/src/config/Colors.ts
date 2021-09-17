export enum StatusColor {
  draft = 'draft',
  published = 'published',
  modified = 'modified',
  withdrawn = 'withdrawn',
  archived = 'archived',
}

const colorMap: Record<string, string> = {
  draft: 'light',
  published: 'success',
  modified: 'warning',
  withdrawn: 'light',
  archived: 'danger',
};

export function resolveBulmaColor(color: keyof typeof StatusColor | undefined): string | undefined {
  if (!color) return undefined;
  return colorMap[color];
}
