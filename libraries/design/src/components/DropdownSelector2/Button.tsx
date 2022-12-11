import type { ReactNode, RefObject } from 'react';
import React, { forwardRef } from 'react';
import type { AriaButtonProps } from 'react-aria';
import { useButton } from 'react-aria';

interface ButtonProps extends AriaButtonProps<'button'> {
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const { buttonProps } = useButton(props, ref as RefObject<HTMLButtonElement>);
  const { children } = props;

  return (
    <button {...buttonProps} ref={ref}>
      {children}
    </button>
  );
});
Button.displayName = 'Button';
