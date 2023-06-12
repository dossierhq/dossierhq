import {
  Button as ReactAriaButton,
  GridList as ReactAriaGridList,
  Item as ReactAriaItem,
} from 'react-aria-components';
import { toClassName } from '../../utils/ClassNameUtils.js';
import {
  extractLayoutProps,
  toSpacingClassName,
  type SpacingProps,
} from '../../utils/LayoutPropsUtils.js';
import { Icon } from '../Icon/Icon.js';
export { useDragAndDrop } from 'react-aria-components';

export type GridListProps<TItem extends object> = React.ComponentProps<
  typeof ReactAriaGridList<TItem>
>;

export type GridListItemProps = React.ComponentProps<typeof ReactAriaItem> & SpacingProps;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GridListDragHandleProps {}

export function GridList<TItem extends object>(props: GridListProps<TItem>) {
  return <ReactAriaGridList {...props} />;
}

export function GridListItem({ className, ...props }: GridListItemProps) {
  const { layoutProps, otherProps } = extractLayoutProps(props);
  return (
    <ReactAriaItem
      className={toClassName(toSpacingClassName(layoutProps), className as string)}
      {...otherProps}
    />
  );
}

export function GridListDragHandle(_props: GridListDragHandleProps) {
  return (
    <ReactAriaButton className="react-aria-Button blank" slot="drag">
      <Icon icon="grip" />
    </ReactAriaButton>
  );
}
