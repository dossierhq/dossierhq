import { toClassName } from './ClassNameUtils';

export interface FlexContainerProps {
  flexDirection?: 'column' | 'row';
}

export function toFlexContainerClassName({ flexDirection }: FlexContainerProps): string {
  return toClassName(
    'is-flex',
    flexDirection &&
      { column: 'is-flex-direction-column', row: 'is-flex-direction-row' }[flexDirection]
  );
}
