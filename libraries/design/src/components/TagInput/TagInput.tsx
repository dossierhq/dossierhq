import type { FunctionComponent, MouseEvent, ReactNode, Ref } from 'react';
import React, { forwardRef } from 'react';

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
          className="field input is-grouped is-grouped-multiline"
          style={{ height: 'auto' }}
          onClick={onClick}
        >
          {children}
        </div>
      </div>
    );
  }
);
TagInput.displayName = 'TagInput';
