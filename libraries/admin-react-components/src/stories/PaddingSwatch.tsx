import React from 'react';
import type { SpacingSize } from '..';
import { joinClassNames } from '../utils/ClassNameUtils';

interface PaddingSwatchProps {
  className: string;
}

export function PaddingSwatch({ className }: PaddingSwatchProps): JSX.Element {
  return (
    <div className={joinClassNames('dd', className)} style={{ border: 'solid 1px black' }}>
      <p
        className={'dd text-caption'}
        style={{
          width: '30px',
          height: '30px',
          backgroundColor: 'hotpink',
          textAlign: 'center',
          padding: '0.5rem',
        }}
      >
        {className}
      </p>
    </div>
  );
}

interface PaddingSwatchGroupProps {
  size: SpacingSize;
}

export function PaddingSwatchGroup({ size }: PaddingSwatchGroupProps): JSX.Element {
  return (
    <div className="dd flex-row g-2" style={{ alignItems: 'center' }}>
      <PaddingSwatch className={`p-${size}`} />
      <PaddingSwatch className={`px-${size}`} />
      <PaddingSwatch className={`py-${size}`} />
      <PaddingSwatch className={`pl-${size}`} />
      <PaddingSwatch className={`pt-${size}`} />
      <PaddingSwatch className={`pr-${size}`} />
      <PaddingSwatch className={`pb-${size}`} />
    </div>
  );
}
