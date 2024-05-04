import {
  DropdownSelector,
  initializeMultipleSelectorState,
  reduceMultipleSelectorState,
  type DropdownSelectorProps,
  type MultipleSelectorItem,
  type MultipleSelectorReducer,
  type MultipleSelectorState,
  type MultipleSelectorStateAction,
} from '@dossierhq/design';
import type { Dispatch } from 'react';
import type { DisplayAuthKey } from '../../types/DisplayAuthKey.js';
import { AuthKeyTag } from '../AuthKeyTag/AuthKeyTag.js';

export interface AuthKeyItem extends MultipleSelectorItem {
  displayName: string;
}

export type AuthKeySelectorReducer = MultipleSelectorReducer<AuthKeyItem>;
export type AuthKeySelectorInitArgs = {
  authKeys: DisplayAuthKey[];
  selectedIds?: string[] | undefined;
};
export type AuthKeySelectorState = MultipleSelectorState<AuthKeyItem>;
export type AuthKeySelectorDispatch = Dispatch<MultipleSelectorStateAction<AuthKeyItem>>;

type Props = Omit<DropdownSelectorProps<AuthKeyItem>, 'renderItem'> & {
  authKeys: DisplayAuthKey[];
};

export function initializeAuthKeySelectorState({
  authKeys,
  selectedIds,
}: AuthKeySelectorInitArgs): AuthKeySelectorState {
  const items: AuthKeyItem[] = authKeys.map((it) => ({
    id: it.authKey,
    displayName: it.displayName,
  }));
  return initializeMultipleSelectorState<AuthKeyItem>({
    items,
    selectedIds,
  });
}

export const reduceAuthKeySelectorState: AuthKeySelectorReducer = reduceMultipleSelectorState;

export function AuthKeySelector(props: Props): JSX.Element {
  return (
    <DropdownSelector<AuthKeyItem>
      {...props}
      renderItem={(item) => <AuthKeyTag authKey={item.id} authKeys={props.authKeys} />}
    />
  );
}
