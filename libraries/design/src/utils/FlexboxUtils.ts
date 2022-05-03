import { toClassName } from './ClassNameUtils.js';

export interface FlexContainerProps {
  flexDirection?: 'column' | 'row';
  alignItems?: 'center';
  justifyContent?: 'center';
}

const flexDirectionClassNames = {
  column: 'is-flex-direction-column',
  row: 'is-flex-direction-row',
};

const alignItemsClassNames = {
  center: 'is-align-items-center',
};

const justifyContentClassNames = {
  center: 'is-justify-content-center',
};

export function toFlexContainerClassName({
  flexDirection,
  alignItems,
  justifyContent,
}: FlexContainerProps): string {
  return toClassName(
    'is-flex',
    flexDirection && flexDirectionClassNames[flexDirection],
    alignItems && alignItemsClassNames[alignItems],
    justifyContent && justifyContentClassNames[justifyContent]
  );
}

export interface FlexItemProps {
  flexGrow?: 0 | 1;
}

export function toFlexItemClassName({ flexGrow }: FlexItemProps) {
  return toClassName(typeof flexGrow === 'number' && `is-flex-grow-${flexGrow}`);
}
