import { useContext, useEffect } from 'react';
import { DossierContext } from '../contexts/DossierContext.js';
import { useSchema } from '../hooks/useSchema.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.js';

interface Props {
  id?: string;
  patternName: string | null;
  value: string | null;
  onValueChange: (value: string) => void;
}

export function AuthKeyPicker({ id, patternName, value, onValueChange }: Props) {
  const { authKeys } = useContext(DossierContext);
  const { schema } = useSchema();

  const pattern = patternName ? schema?.getPattern(patternName) : null;
  const regexp = pattern ? new RegExp(pattern.pattern) : null;
  const filteredAuthKeys = regexp
    ? authKeys.filter((authKey) => regexp.test(authKey.authKey))
    : authKeys;

  // Auto-select the first item if there is only one
  useEffect(() => {
    if (!value && filteredAuthKeys.length === 1) {
      onValueChange(filteredAuthKeys[0].authKey);
    }
  }, [filteredAuthKeys, onValueChange, value]);

  return (
    <Select disabled={!schema} value={value ?? ''} onValueChange={onValueChange}>
      <SelectTrigger id={id}>
        <SelectValue placeholder="Select authorization key" />
      </SelectTrigger>
      <SelectContent>
        {filteredAuthKeys.map((it) => (
          <SelectItem key={it.authKey} value={it.authKey}>
            {it.displayName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
