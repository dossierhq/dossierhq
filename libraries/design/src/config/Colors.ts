export const StatusColor = {
  draft: 'draft',
  published: 'published',
  modified: 'modified',
  withdrawn: 'withdrawn',
  archived: 'archived',
} as const;

export type StatusColor = typeof StatusColor[keyof typeof StatusColor];

const BulmaColor = {
  danger: 'danger',
  light: 'light',
  primary: 'primary',
} as const;

export const Color = {
  ...StatusColor,
  ...BulmaColor,
};

export type Color = typeof Color[keyof typeof Color];

const statusColorMap: Record<StatusColor, string> = {
  draft: 'light',
  published: 'success',
  modified: 'warning',
  withdrawn: 'light',
  archived: 'danger',
};

export function resolveBulmaColor(color: Color | undefined): string | undefined {
  if (!color) return undefined;
  const statusColorValue = statusColorMap[color as StatusColor];
  return statusColorValue ?? color;
}

export function toColorClassName(color: Color | undefined): string | undefined {
  const colorName = resolveBulmaColor(color);
  if (!colorName) return undefined;
  return `is-${colorName}`;
}
