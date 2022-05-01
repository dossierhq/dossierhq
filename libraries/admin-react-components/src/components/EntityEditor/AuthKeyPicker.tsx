import { ButtonDropdown } from '@jonasb/datadata-design';
import React from 'react';
import { useContext } from 'react';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext';

interface Props {
  value: string | null;
  onValueChange: (value: string) => void;
}

export function AuthKeyPicker({ value, onValueChange }: Props) {
  const { authKeys } = useContext(AdminDataDataContext);

  const items = authKeys.map((it) => ({ id: it.authKey, displayName: it.displayName }));
  let text = 'Select authorization key';
  if (value) {
    const key = authKeys.find((it) => it.authKey === value);
    text = key ? key.displayName : value;
  }

  return (
    <ButtonDropdown
      items={items}
      renderItem={(item) => item.displayName}
      onItemClick={(item) => onValueChange(item.id)}
    >
      {text}
    </ButtonDropdown>
  );
}
