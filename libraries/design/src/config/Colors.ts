export const StatusColor = {
  draft: 'draft',
  published: 'published',
  modified: 'modified',
  withdrawn: 'withdrawn',
  archived: 'archived',
} as const;

export type StatusColor = typeof StatusColor[keyof typeof StatusColor];

const BulmaColor = {
  black: 'black',
  danger: 'danger',
  dark: 'dark',
  info: 'info',
  light: 'light',
  link: 'link',
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  white: 'white',
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

function resolveBulmaColor(color: Color | undefined): string | undefined {
  if (!color) return undefined;
  const statusColorValue = statusColorMap[color as StatusColor];
  return statusColorValue ?? color;
}

export function toColorClassName(color: Color | undefined): string | undefined {
  const colorName = resolveBulmaColor(color);
  if (!colorName) return undefined;
  return `is-${colorName}`;
}

export function toBackgroundColorClassName(
  color: Color | undefined,
  variant?: 'dark' | 'light'
): string | undefined {
  const colorName = resolveBulmaColor(color);
  if (!colorName) return undefined;
  return `has-background-${colorName}${variant ? `-${variant}` : ''}`;
}
