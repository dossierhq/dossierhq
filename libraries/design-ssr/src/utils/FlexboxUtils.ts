import { toClassName } from './ClassNameUtils.js';

export interface FlexContainerProps {
  flexDirection?: keyof typeof flexDirectionClassNames;
  alignItems?: keyof typeof alignItemsClassNames;
  justifyContent?: keyof typeof justifyContentClassNames;
}

const flexDirectionClassNames = {
  column: 'is-flex-direction-column',
  row: 'is-flex-direction-row',
};

const alignItemsClassNames = {
  center: 'is-align-items-center',
  'flex-start': 'is-align-items-flex-start',
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
    justifyContent && justifyContentClassNames[justifyContent],
  );
}

export interface FlexItemProps {
  flexGrow?: 0 | 1;
  alignSelf?: keyof typeof alignSelfClassNames;
}

const alignSelfClassNames = {
  center: 'is-align-self-center',
  'flex-start': 'is-align-self-flex-start',
  'flex-end': 'is-align-self-flex-end',
};

export function toFlexItemClassName({ alignSelf, flexGrow }: FlexItemProps) {
  return toClassName(
    typeof flexGrow === 'number' && `is-flex-grow-${flexGrow}`,
    alignSelf && alignSelfClassNames[alignSelf],
  );
}
