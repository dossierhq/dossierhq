import * as VisuallyHiddenPrimitive from '@radix-ui/react-visually-hidden';
import type { ComponentProps } from 'react';

export function VisuallyHidden(props: ComponentProps<typeof VisuallyHiddenPrimitive.Root>) {
  return <VisuallyHiddenPrimitive.Root {...props} />;
}
