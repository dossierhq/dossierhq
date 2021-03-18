import React from 'react';
import { gapClassName, joinClassNames } from '../utils/ClassNameUtils';

interface GapSwatchProps {
  size: SpacingSize;
}

export function GapSwatch({ size }: GapSwatchProps): JSX.Element {
  return (
    <div
      className={joinClassNames('dd flex-row', gapClassName(size))}
      style={{ border: 'solid 1px black' }}
    >
      {[...new Array(5)].map((_, index) => (
        <div
          key={index}
          className="dd text-caption p-1"
          style={{
            width: '30px',
            height: '30px',
            backgroundColor: 'turquoise',
          }}
        >
          {gapClassName(size)}
        </div>
      ))}
    </div>
  );
}
