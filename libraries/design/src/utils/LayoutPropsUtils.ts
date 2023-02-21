import { toClassName } from './ClassNameUtils.js';
import type { FlexContainerProps } from './FlexboxUtils.js';

export type SpacingValue = (typeof SpacingValues)[number];
export const SpacingValues = [0, 1, 2, 3, 4, 5, 6] as const;

export interface SpacingProps extends MarginProps, PaddingProps, GapProps {}

export interface MarginProps {
  margin?: SpacingValue;
  marginLeft?: SpacingValue;
  marginTop?: SpacingValue;
  marginRight?: SpacingValue;
  marginBottom?: SpacingValue;
  marginHorizontal?: SpacingValue;
  marginVertical?: SpacingValue;
}

export interface PaddingProps {
  padding?: SpacingValue;
  paddingLeft?: SpacingValue;
  paddingTop?: SpacingValue;
  paddingRight?: SpacingValue;
  paddingBottom?: SpacingValue;
  paddingHorizontal?: SpacingValue;
  paddingVertical?: SpacingValue;
}

export interface GapProps {
  gap?: SpacingValue;
  columnGap?: SpacingValue;
  rowGap?: SpacingValue;
}

const heightToClassNameMap = {
  0: 'is-height-0',
  '100%': 'is-height-100',
  '100vh': 'is-height-100vh',
};

const widthToClassNameMap = {
  '100%': 'is-width-100',
};

const maxWidthToClassNameMap = {
  '40rem': 'is-max-width-40rem',
};

const aspectRatioClassNameMap = {
  '1/1': 'is-aspect-1',
  '16/9': 'is-aspect-16-9',
};

export interface SizeProps {
  width?: keyof typeof widthToClassNameMap;
  height?: keyof typeof heightToClassNameMap;
  maxWidth?: keyof typeof maxWidthToClassNameMap;
  aspectRatio?: keyof typeof aspectRatioClassNameMap;
}

type LayoutProps = SizeProps & SpacingProps & FlexContainerProps;

export function toSpacingClassName({
  margin,
  marginLeft,
  marginTop,
  marginRight,
  marginBottom,
  marginHorizontal,
  marginVertical,
  padding,
  paddingLeft,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingHorizontal,
  paddingVertical,
  gap,
  columnGap,
  rowGap,
}: MarginProps & PaddingProps & GapProps): string {
  return toClassName(
    valueClassName('m-', margin),
    valueClassName('ml-', marginLeft),
    valueClassName('mt-', marginTop),
    valueClassName('mr-', marginRight),
    valueClassName('mb-', marginBottom),
    valueClassName('mx-', marginHorizontal),
    valueClassName('my-', marginVertical),
    valueClassName('p-', padding),
    valueClassName('pl-', paddingLeft),
    valueClassName('pt-', paddingTop),
    valueClassName('pr-', paddingRight),
    valueClassName('pb-', paddingBottom),
    valueClassName('px-', paddingHorizontal),
    valueClassName('py-', paddingVertical),
    valueClassName('g-', gap),
    valueClassName('gc-', columnGap),
    valueClassName('gr-', rowGap)
  );
}

function valueClassName(prefix: string, value: SpacingValue | undefined) {
  return typeof value === 'number' ? prefix + value : undefined;
}

export function toSizeClassName({ width, height, maxWidth, aspectRatio }: SizeProps): string {
  return toClassName(
    width !== undefined && widthToClassNameMap[width],
    height !== undefined && heightToClassNameMap[height],
    maxWidth !== undefined && maxWidthToClassNameMap[maxWidth],
    aspectRatio !== undefined && aspectRatioClassNameMap[aspectRatio]
  );
}

export function extractLayoutProps<T extends LayoutProps>(
  props: T
): { layoutProps: LayoutProps; otherProps: Omit<T, keyof LayoutProps> } {
  const {
    margin,
    marginLeft,
    marginTop,
    marginRight,
    marginBottom,
    marginHorizontal,
    marginVertical,
    padding,
    paddingLeft,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingHorizontal,
    paddingVertical,
    gap,
    columnGap,
    rowGap,
    width,
    height,
    flexDirection,
    alignItems,
    justifyContent,
    ...otherProps
  } = props;
  const layoutProps = {
    margin,
    marginLeft,
    marginTop,
    marginRight,
    marginBottom,
    marginHorizontal,
    marginVertical,
    padding,
    paddingLeft,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingHorizontal,
    paddingVertical,
    gap,
    columnGap,
    rowGap,
    width,
    height,
    flexDirection,
    alignItems,
    justifyContent,
  };
  return { layoutProps, otherProps: otherProps as Omit<T, keyof LayoutProps> };
}
