import { Card2, Dialog2, Table } from '@dossierhq/design';
import { useContext, type JSX } from 'react';
import { DossierContext } from '../../contexts/DossierContext.js';
import {
  filterTypeSpecifications,
  type TypeSelectionFilter,
} from '../../utils/TypeSelectionUtils.js';

export interface AdminTypePickerDialogProps extends TypeSelectionFilter {
  title: string;
  onItemClick: (type: string) => void;
}

interface Item {
  id: string;
  name: string;
}

export function AdminTypePickerDialog({
  title,
  onItemClick,
  ...filter
}: AdminTypePickerDialogProps): JSX.Element {
  const { schema } = useContext(DossierContext);

  let items: Item[] = [];
  if (schema) {
    items = filterTypeSpecifications(schema, filter).map((it) => ({ id: it.name, name: it.name }));
  }

  return (
    <Dialog2 width="narrow">
      {({ close }) => (
        <Card2>
          <Card2.Header>
            <Card2.HeaderTitle>{title}</Card2.HeaderTitle>
            <Card2.HeaderIconButton icon="close" onClick={close} />
          </Card2.Header>
          <Card2.Content noPadding>
            <Table hoverable>
              <Table.Body>
                {items.map((item) => (
                  <Table.Row key={item.id} clickable onClick={() => onItemClick(item.id)}>
                    <Table.Cell>{item.name}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </Card2.Content>
        </Card2>
      )}
    </Dialog2>
  );
}
