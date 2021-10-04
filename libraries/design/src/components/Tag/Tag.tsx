import type { FunctionComponent, MouseEventHandler, ReactElement } from 'react';
import React from 'react';
import { Tag as BulmaTag } from 'react-bulma-components';
import type { StatusColor } from '../../index.js';
import { resolveBulmaColor } from '../../config/Colors.js';

export interface TagProps {
  color?: keyof typeof StatusColor;
  children: string | [string, ReactElement<TagRemoveProps>];
}

export interface TagRemoveProps {
  onClick?: MouseEventHandler<HTMLElement>;
}

export interface TagClearProps {
  onClick?: MouseEventHandler<HTMLElement>;
  children: React.ReactNode;
}

export interface TagGroupProps {
  children: React.ReactNode;
}

interface TagComponent extends FunctionComponent<TagProps> {
  Remove: FunctionComponent<TagRemoveProps>;
  Clear: FunctionComponent<TagClearProps>;
  Group: FunctionComponent<TagGroupProps>;
}

export const Tag: TagComponent = ({ color, children }: TagProps) => {
  const bulmaColor = resolveBulmaColor(color);
  if (typeof children === 'string') {
    return (
      <BulmaTag className="control" color={bulmaColor}>
        {children}
      </BulmaTag>
    );
  }
  return (
    <div className="control">
      <BulmaTag.Group hasAddons>
        <BulmaTag color={bulmaColor}>{children[0]}</BulmaTag>
        {children[1]}
      </BulmaTag.Group>
    </div>
  );
};
Tag.displayName = 'Tag';

Tag.Remove = ({ onClick }: TagRemoveProps) => {
  return <BulmaTag className="is-clickable" remove onClick={onClick} />;
};
Tag.Remove.displayName = 'Tag.Remove';

Tag.Clear = ({ onClick, children }: TagClearProps) => {
  return (
    <BulmaTag className="is-clickable" color="white" onClick={onClick}>
      {children}
    </BulmaTag>
  );
};
Tag.Clear.displayName = 'Tag.Clear';

Tag.Group = ({ children }: TagGroupProps) => {
  return <div className="field is-grouped">{children}</div>;
};
Tag.Group.displayName = 'Tag.Group';
