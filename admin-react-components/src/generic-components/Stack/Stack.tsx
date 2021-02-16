import type { FunctionComponent } from 'react';
import React from 'react';

export interface StackProps {
  children: React.ReactNode;
}

interface StackCenterLayerProps {
  children: React.ReactNode;
}

interface StackComponent extends FunctionComponent<StackProps> {
  CenterLayer: FunctionComponent<StackCenterLayerProps>;
}

export const Stack: StackComponent = ({ children }: StackProps) => (
  <div className="dd stack">{children}</div>
);
Stack.displayName = 'Stack';

Stack.CenterLayer = ({ children }: StackCenterLayerProps) => (
  <div className="dd stack-center-layer">{children}</div>
);
Stack.CenterLayer.displayName = 'Stack.CenterLayer';
