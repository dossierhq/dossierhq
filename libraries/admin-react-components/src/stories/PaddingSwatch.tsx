import React from 'react';
import type { SpacingSize } from '..';

interface PaddingSwatchProps {
  className: string;
}

export function PaddingSwatch({ className }: PaddingSwatchProps): JSX.Element {
  return (
    <div className={className} style={{ border: 'solid 1px black' }}>
      <p
        className={'dd-text-caption'}
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
    <div className="dd-flex-row dd-g-2" style={{ alignItems: 'center' }}>
      <PaddingSwatch className={`dd-p-${size}`} />
      <PaddingSwatch className={`dd-px-${size}`} />
      <PaddingSwatch className={`dd-py-${size}`} />
      <PaddingSwatch className={`dd-pl-${size}`} />
      <PaddingSwatch className={`dd-pt-${size}`} />
      <PaddingSwatch className={`dd-pr-${size}`} />
      <PaddingSwatch className={`dd-pb-${size}`} />
    </div>
  );
}
