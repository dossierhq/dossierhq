import type { FunctionComponent } from 'react';
import React from 'react';
import { gapClassName, joinClassNames } from '../../utils/ClassNameUtils';

export interface RowProps {
  gap?: SpacingSize;
  children: React.ReactNode;
}

interface RowColumnProps {
  grow?: boolean;
  className?: string;
  children: React.ReactNode;
}

interface RowComponent extends FunctionComponent<RowProps> {
  Column: FunctionComponent<RowColumnProps>;
}

export const Row: RowComponent = ({ gap, children }: RowProps) => (
  <div className={joinClassNames('dd flex-row', gapClassName(gap))}>{children}</div>
);
Row.displayName = 'Row';

Row.Column = ({ className, grow, children }: RowColumnProps) => {
  return <div className={joinClassNames('dd', grow ? 'flex-grow' : '', className)}>{children}</div>;
};
Row.Column.displayName = 'Row.Column';
