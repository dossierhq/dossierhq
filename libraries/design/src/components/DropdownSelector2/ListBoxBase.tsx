import type { ReactNode } from 'react';
import React, { useRef } from 'react';
import { useListBox } from 'react-aria';
import type { ListProps, ListState } from 'react-stately';
import { ListBoxSection } from './ListBoxSection.js';
import { Option } from './Option';

interface ListBoxBaseProps<T> extends Omit<ListProps<T>, 'children'> {
  label?: ReactNode;
  state: ListState<T>;
}

export function ListBoxBase<T extends object>(props: ListBoxBaseProps<T>) {
  const { state } = props;
  // Get props for the listbox element
  const ref = useRef<HTMLUListElement>(null);
  const { listBoxProps, labelProps } = useListBox(props, state, ref);

  return (
    <>
      <div {...labelProps}>{props.label}</div>
      <ul
        {...listBoxProps}
        ref={ref}
        style={{
          padding: 0,
          margin: '5px 0',
          listStyle: 'none',
          border: '1px solid gray',
          maxWidth: 250,
          maxHeight: 300,
          overflow: 'auto',
        }}
      >
        {[...state.collection].map((item) =>
          item.type === 'section' ? (
            <ListBoxSection key={item.key} section={item} state={state} />
          ) : (
            <Option key={item.key} item={item} state={state} />
          )
        )}
      </ul>
    </>
  );
}
