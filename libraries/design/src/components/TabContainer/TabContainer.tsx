import type { FunctionComponent, MouseEventHandler, ReactNode } from 'react';
import { toClassName } from '../../utils/ClassNameUtils.js';

export interface TabContainerProps {
  small?: boolean;
  children: ReactNode;
}

interface TabContainerItemProps {
  active?: boolean;
  onClick: MouseEventHandler<HTMLAnchorElement>;
  children?: ReactNode;
}

interface TabContainerComponent extends FunctionComponent<TabContainerProps> {
  Item: FunctionComponent<TabContainerItemProps>;
}

export const TabContainer: TabContainerComponent = ({ small, children }: TabContainerProps) => {
  return (
    <div className={toClassName('tabs is-toggle is-centered', small && 'is-small')}>
      <ul>{children}</ul>
    </div>
  );
};
TabContainer.displayName = 'TabContainer';

TabContainer.Item = ({ active, onClick, children }: TabContainerItemProps) => {
  return (
    <li className={active ? 'is-active' : undefined}>
      <a onClick={onClick}>{children}</a>
    </li>
  );
};
TabContainer.Item.displayName = 'TabContainer.Item';
