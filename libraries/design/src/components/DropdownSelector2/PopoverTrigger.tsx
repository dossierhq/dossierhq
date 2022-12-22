import type { ReactNode } from 'react';
import React, { useRef } from 'react';
import { useOverlayTrigger } from 'react-aria';
import { useOverlayTriggerState } from 'react-stately';
import { Popover } from './Popover.js';

interface Props {
  label?: ReactNode;
  children: any;
}

export function PopoverTrigger({ label, children, ...props }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const state = useOverlayTriggerState(props);
  const { triggerProps, overlayProps } = useOverlayTrigger({ type: 'dialog' }, state, ref);

  return (
    <>
      <button {...triggerProps} onClick={triggerProps.onPress as any} ref={ref}>
        {label}
      </button>
      {state.isOpen && (
        <Popover {...props} triggerRef={ref} state={state}>
          {React.cloneElement(children, overlayProps)}
        </Popover>
      )}
    </>
  );
}
