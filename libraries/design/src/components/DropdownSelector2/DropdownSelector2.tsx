import type { CollectionChildren } from '@react-types/shared';
import type { ReactNode } from 'react';
import React, { useRef } from 'react';
import { HiddenSelect, useSelect } from 'react-aria';
import { useSelectState } from 'react-stately';
import { Button } from './Button.js';
import { ListBoxBase } from './ListBoxBase.js';
import { Popover } from './Popover.js';
export { Item, Section } from 'react-stately';

export interface DropdownSelector2Props<T> {
  label?: ReactNode;
  name?: string;
  children: CollectionChildren<T>;
}

export function DropdownSelector2<T extends object>(props: DropdownSelector2Props<T>) {
  const ref = useRef<HTMLButtonElement>(null);
  const state = useSelectState(props);
  const { labelProps, triggerProps, valueProps, menuProps } = useSelect(props, state, ref);

  return (
    <div style={{ display: 'inline-block' }}>
      <div {...labelProps}>{props.label}</div>
      <HiddenSelect state={state} triggerRef={ref} label={props.label} name={props.name} />
      <Button {...triggerProps} ref={ref}>
        <span {...valueProps}>
          {state.selectedItem ? state.selectedItem.rendered : 'Select an option'}
        </span>
      </Button>
      {state.isOpen && (
        <Popover state={state} triggerRef={ref} placement="bottom start">
          <ListBoxBase<T> {...menuProps} state={state} />
        </Popover>
      )}
    </div>
  );
}
