import type { FunctionComponent, ReactNode } from 'react';
import React from 'react';
import { toClassName } from '../../utils/ClassNameUtils';
import type { TextStyle } from '../../utils/TextStylePropsUtils';
import { toTextStyleClassName } from '../../utils/TextStylePropsUtils';

export interface LevelProps {
  sticky?: boolean;
  children: ReactNode;
}

interface LevelLeftProps {
  children: ReactNode;
}

interface LevelRightProps {
  children: ReactNode;
}

interface LevelItemProps {
  textStyle?: TextStyle;
  children: ReactNode;
}

interface LevelComponent extends FunctionComponent<LevelProps> {
  Left: FunctionComponent<LevelLeftProps>;
  Right: FunctionComponent<LevelRightProps>;
  Item: FunctionComponent<LevelItemProps>;
}

export const Level: LevelComponent = ({ sticky, children }: LevelProps) => {
  return <nav className={toClassName('level', sticky && 'is-sticky-row')}>{children}</nav>;
};
Level.displayName = 'Level';

Level.Left = ({ children }: LevelLeftProps) => {
  return <div className="level-left">{children}</div>;
};
Level.Left.displayName = 'Level.Left';

Level.Right = ({ children }: LevelRightProps) => {
  return <div className="level-right">{children}</div>;
};
Level.Right.displayName = 'Level.Right';

Level.Item = ({ textStyle, children }: LevelItemProps) => {
  return (
    <div className={toClassName('level-item', textStyle && toTextStyleClassName(textStyle))}>
      {children}
    </div>
  );
};
Level.Item.displayName = 'Level.Item';
