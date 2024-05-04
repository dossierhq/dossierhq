import type { FunctionComponent, MouseEventHandler, ReactElement } from 'react';
import { toColorClassName, type Color } from '../../config/Colors.js';
import { toClassName } from '../../utils/ClassNameUtils.js';

export interface TagProps {
  className?: string;
  color?: Color;
  transform?: 'capitalized' | '';
  children: string | [string, ReactElement<TagRemoveProps> | null];
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

export const Tag: TagComponent = ({ className, color, transform, children }: TagProps) => {
  const tagClassName = toClassName(
    'tag',
    (transform === undefined || transform === 'capitalized') && 'is-capitalized',
    toColorClassName(color),
  );
  if (typeof children === 'string') {
    return <span className={toClassName(tagClassName, 'control', className)}>{children}</span>;
  }
  return (
    <div className={toClassName('control', className)}>
      <span className="tags has-addons">
        <span className={tagClassName}>{children[0]}</span>
        {children[1]}
      </span>
    </div>
  );
};
Tag.displayName = 'Tag';

Tag.Remove = ({ onClick }: TagRemoveProps) => {
  return <span className="tag is-delete is-clickable" onClick={onClick} />;
};
Tag.Remove.displayName = 'Tag.Remove';

Tag.Clear = ({ onClick, children }: TagClearProps) => {
  return (
    <span className="tag is-clickable is-white" onClick={onClick}>
      {children}
    </span>
  );
};
Tag.Clear.displayName = 'Tag.Clear';

Tag.Group = ({ children }: TagGroupProps) => {
  return <div className="field is-grouped is-grouped-multiline">{children}</div>;
};
Tag.Group.displayName = 'Tag.Group';
