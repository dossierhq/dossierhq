import { toClassName } from './ClassNameUtils';

type SpacingValue = 0 | 1 | 2 | 3 | 4 | 5 | 6;

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
    valueClassName('mt-', marginRight),
    valueClassName('mb-', marginBottom),
    valueClassName('mx-', marginHorizontal),
    valueClassName('my-', marginVertical),
    valueClassName('p-', padding),
    valueClassName('pl-', paddingLeft),
    valueClassName('pt-', paddingTop),
    valueClassName('pt-', paddingRight),
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
