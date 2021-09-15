import type { FunctionComponent } from 'react';
import React from 'react';

export interface StackProps {
  children: React.ReactNode;
}

interface StackLayerProps {
  left?: boolean;
  top?: boolean;
  right?: boolean;
  bottom?: boolean;

  children: React.ReactNode;
}

interface StackCenterLayerProps {
  children: React.ReactNode;
}

interface StackComponent extends FunctionComponent<StackProps> {
  Layer: FunctionComponent<StackLayerProps>;
  CenterLayer: FunctionComponent<StackCenterLayerProps>;
}

export const Stack: StackComponent = ({ children }: StackProps) => (
  <div className="dd-stack">{children}</div>
);
Stack.displayName = 'Stack';

Stack.Layer = ({ left, top, right, bottom, children }: StackLayerProps) => {
  const locations = [];
  if (left) locations.push('dd-left');
  if (top) locations.push('dd-top');
  if (right) locations.push('dd-right');
  if (bottom) locations.push('dd-bottom');
  return <div className={`dd-stack-layer ${locations.join(' ')}`}>{children}</div>;
};
Stack.Layer.displayName = 'Stack.Layer';

Stack.CenterLayer = ({ children }: StackCenterLayerProps) => (
  <div className="dd-stack-center-layer">{children}</div>
);
Stack.CenterLayer.displayName = 'Stack.CenterLayer';
