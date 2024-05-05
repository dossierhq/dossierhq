import { ButtonDropdown, type IconName } from '@dossierhq/design';
import { useContext, type ReactNode } from 'react';
import { DossierContext } from '../../contexts/DossierContext.js';
import {
  filterTypeSpecifications,
  type TypeSelectionFilter,
} from '../../utils/TypeSelectionUtils.js';

export interface AdminTypePickerProps extends TypeSelectionFilter {
  className?: string;
  iconLeft?: IconName;
  onTypeSelected?: (type: string) => void;
  children: ReactNode;
}

interface Item {
  id: string;
  name: string;
}

export function AdminTypePicker({
  className,
  iconLeft,
  onTypeSelected,
  children,
  ...filter
}: AdminTypePickerProps): JSX.Element {
  const { schema } = useContext(DossierContext);

  let items: Item[] = [];
  if (schema) {
    items = filterTypeSpecifications(schema, filter).map((it) => ({ id: it.name, name: it.name }));
  }

  return (
    <ButtonDropdown
      className={className}
      iconLeft={iconLeft}
      items={items}
      renderItem={(item) => item.name}
      disabled={!schema || items.length === 0}
      onItemClick={onTypeSelected ? (item) => onTypeSelected(item.id) : undefined}
    >
      {children}
    </ButtonDropdown>
  );
}
