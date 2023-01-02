import { toClassName } from './ClassNameUtils.js';

export interface FlexContainerProps {
  flexDirection?: keyof typeof flexDirectionClassNames;
  alignItems?: keyof typeof alignItemsClassNames;
  justifyContent?: keyof typeof justifyContentClassNames;
  overflowX?: keyof typeof overflowXClassNames;
  overflowY?: keyof typeof overflowYClassNames;
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

const overflowXClassNames = {
  auto: 'is-overflow-x-auto',
};

const overflowYClassNames = {
  auto: 'is-overflow-y-auto',
};

export function toFlexContainerClassName({
  flexDirection,
  alignItems,
  justifyContent,
  overflowX,
  overflowY,
}: FlexContainerProps): string {
  return toClassName(
    'is-flex',
    flexDirection && flexDirectionClassNames[flexDirection],
    alignItems && alignItemsClassNames[alignItems],
    justifyContent && justifyContentClassNames[justifyContent],
    overflowX && overflowXClassNames[overflowX],
    overflowY && overflowYClassNames[overflowY]
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
    alignSelf && alignSelfClassNames[alignSelf]
  );
}
