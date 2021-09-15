import React from 'react';

interface SegmentProps {
  children: React.ReactNode;
}

export function Segment({ children }: SegmentProps): JSX.Element {
  return <div className="dd-segment dd-has-shadow">{children}</div>;
}
