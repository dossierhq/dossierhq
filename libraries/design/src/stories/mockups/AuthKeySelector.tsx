import React, { type Dispatch } from 'react';
import {
  DropdownSelector,
  type DropdownSelectorProps,
} from '../../components/DropdownSelector/DropdownSelector.js';
import {
  initializeMultipleSelectorState,
  type MultipleSelectorItem,
  type MultipleSelectorReducer,
  type MultipleSelectorState,
  type MultipleSelectorStateAction,
} from '../../components/DropdownSelector/MultipleSelectorReducer.js';
import { Tag } from '../../components/Tag/Tag.js';

export interface AuthKeyItem extends MultipleSelectorItem {
  name: string;
}

export type AuthKeySelectorReducer = MultipleSelectorReducer<AuthKeyItem>;
export type AuthKeySelectorInitArgs = { selectedIds?: string[] };
export type AuthKeySelectorState = MultipleSelectorState<AuthKeyItem>;
export type AuthKeySelectorDispatch = Dispatch<MultipleSelectorStateAction<AuthKeyItem>>;

type Props = Omit<DropdownSelectorProps<AuthKeyItem>, 'renderItem'>;

export function initializeAuthKeySelectorState({
  selectedIds,
}: AuthKeySelectorInitArgs): MultipleSelectorState<AuthKeyItem> {
  const items: AuthKeyItem[] = [
    { id: 'none', name: 'None' },
    { id: 'subject', name: 'Subject' },
  ];
  return initializeMultipleSelectorState({
    items,
    selectedIds,
  });
}

export function AuthKeySelector(props: Props): JSX.Element {
  return <DropdownSelector<AuthKeyItem> {...props} renderItem={(item) => <Tag>{item.name}</Tag>} />;
}
