import type { FunctionComponent } from 'react';
import {
  Dialog as ReactAriaDialog,
  DialogTrigger as ReactAriaDialogTrigger,
  Modal as ReactAriaModal,
  type DialogProps,
  type DialogTriggerProps,
} from 'react-aria-components';
import { toClassName } from '../../utils/ClassNameUtils.js';
import { toSizeClassName } from '../../utils/LayoutPropsUtils.js';

export interface Dialog2Props extends DialogProps {
  width?: keyof typeof widthClassNameMap;
  height?: keyof typeof heightClassNameMap;
}

interface Dialog2Component extends FunctionComponent<Dialog2Props> {
  Trigger: FunctionComponent<DialogTriggerProps>;
}

const widthClassNameMap = {
  narrow: toSizeClassName({ width: '100%', maxWidth: '40rem' }),
  wide: toSizeClassName({ width: '100%' }),
};

const heightClassNameMap = {
  fill: toSizeClassName({ height: '100vh' }),
};

export const Dialog2: Dialog2Component = ({ width, height, children }: Dialog2Props) => {
  const modalClassName = toClassName(
    'react-aria-Modal',
    widthClassNameMap[width ?? 'narrow'],
    height && heightClassNameMap[height]
  );
  const dialogClassName = toClassName(
    'react-aria-Dialog',
    width === 'wide' && 'container',
    height === 'fill' && 'is-height-100'
  );

  return (
    <ReactAriaModal className={modalClassName}>
      <ReactAriaDialog className={dialogClassName}>{children}</ReactAriaDialog>
    </ReactAriaModal>
  );
};

Dialog2.Trigger = (props: DialogTriggerProps) => {
  return <ReactAriaDialogTrigger {...props} />;
};
Dialog2.Trigger.displayName = 'Dialog2.Trigger';
