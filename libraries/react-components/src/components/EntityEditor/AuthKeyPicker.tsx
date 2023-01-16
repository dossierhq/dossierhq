import { ButtonDropdown } from '@dossierhq/design';
import { useContext, useEffect } from 'react';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext.js';

interface Props {
  patternName: string | null;
  value: string | null;
  onValueChange: (value: string) => void;
}

export function AuthKeyPicker({ patternName, value, onValueChange }: Props) {
  const { schema, authKeys } = useContext(AdminDataDataContext);

  const pattern = patternName ? schema?.getPattern(patternName) : null;
  const regexp = pattern ? new RegExp(pattern.pattern) : null;
  const filteredAuthKeys = regexp
    ? authKeys.filter((authKey) => regexp.test(authKey.authKey))
    : authKeys;

  const items = filteredAuthKeys.map((it) => ({ id: it.authKey, displayName: it.displayName }));
  let text = 'Select authorization key';
  if (value) {
    const key = authKeys.find((it) => it.authKey === value);
    text = key ? key.displayName : value;
  }

  // Auto-select the first item if there is only one
  useEffect(() => {
    if (!value && items.length === 1) {
      onValueChange(items[0].id);
    }
  }, [items, onValueChange, value]);

  return (
    <ButtonDropdown
      disabled={!schema}
      items={items}
      renderItem={(item) => item.displayName}
      onItemClick={(item) => onValueChange(item.id)}
    >
      {text}
    </ButtonDropdown>
  );
}
