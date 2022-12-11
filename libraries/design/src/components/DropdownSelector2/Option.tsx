import type { Node } from '@react-types/shared';
import React from 'react';
import { mergeProps, useFocusRing, useOption } from 'react-aria';
import type { ListState } from 'react-stately';

export interface OptionProps<T> {
  item: Node<T>;
  state: ListState<T>;
}

export function Option<T extends object>({ item, state }: OptionProps<T>) {
  const ref = React.useRef<HTMLLIElement>(null);
  const { optionProps, isSelected, isDisabled } = useOption({ key: item.key }, state, ref);

  // Determine whether we should show a keyboard
  // focus ring for accessibility
  const { isFocusVisible, focusProps } = useFocusRing();

  return (
    <li
      {...mergeProps(optionProps, focusProps)}
      ref={ref}
      style={{
        background: isSelected ? 'blueviolet' : 'transparent',
        color: isDisabled ? '#aaa' : isSelected ? 'white' : undefined,
        padding: '2px 5px',
        outline: isFocusVisible ? '2px solid orange' : 'none',
      }}
    >
      {item.rendered}
    </li>
  );
}
