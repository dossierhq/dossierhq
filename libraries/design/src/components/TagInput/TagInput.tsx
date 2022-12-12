import type { FunctionComponent, MouseEvent, ReactNode, Ref } from 'react';
import { forwardRef } from 'react';
import { Tag } from '../Tag/Tag.js';

export interface TagInputProps {
  ref?: Ref<HTMLDivElement>;
  onClick?: (event: MouseEvent) => void;
  children: ReactNode;
}

export const TagInput: FunctionComponent<TagInputProps> = forwardRef(
  ({ onClick, children }: TagInputProps, ref) => {
    return (
      <div className="control">
        <div
          ref={ref}
          className="field input is-clickable"
          style={{ height: 'auto', minHeight: '2.5em' }}
          onClick={onClick}
        >
          <Tag.Group>{children}</Tag.Group>
        </div>
      </div>
    );
  }
);
TagInput.displayName = 'TagInput';
