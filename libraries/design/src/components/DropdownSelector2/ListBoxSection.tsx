import type { Node } from '@react-types/shared';
import React from 'react';
import { useListBoxSection, useSeparator } from 'react-aria';
import type { ListState } from 'react-stately';
import { Option } from './Option.js';

interface ListBoxSectionProps<T> {
  section: Node<T>;
  state: ListState<T>;
}

export function ListBoxSection<T extends object>({ section, state }: ListBoxSectionProps<T>) {
  const { itemProps, headingProps, groupProps } = useListBoxSection({
    heading: section.rendered,
    'aria-label': section['aria-label'],
  });

  const { separatorProps } = useSeparator({
    elementType: 'li',
  });

  // If the section is not the first, add a separator element.
  // The heading is rendered inside an <li> element, which contains
  // a <ul> with the child items.
  return (
    <>
      {section.key !== state.collection.getFirstKey() && (
        <li
          {...separatorProps}
          style={{
            borderTop: '1px solid gray',
            margin: '2px 5px',
          }}
        />
      )}
      <li {...itemProps}>
        {section.rendered && (
          <span
            {...headingProps}
            style={{
              fontWeight: 'bold',
              fontSize: '1.1em',
              padding: '2px 5px',
            }}
          >
            {section.rendered}
          </span>
        )}
        <ul
          {...groupProps}
          style={{
            padding: 0,
            listStyle: 'none',
          }}
        >
          {[...section.childNodes].map((node) => (
            <Option<T> key={node.key} item={node} state={state} />
          ))}
        </ul>
      </li>
    </>
  );
}
