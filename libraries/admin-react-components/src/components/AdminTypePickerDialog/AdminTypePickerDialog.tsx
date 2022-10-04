import { Card2, Dialog, Table } from '@jonasb/datadata-design';
import { useContext } from 'react';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext.js';
import type { TypeSelectionFilter } from '../../utils/TypeSelectionUtils.js';
import { filterTypeSpecifications } from '../../utils/TypeSelectionUtils.js';

export interface AdminTypePickerDialogProps extends TypeSelectionFilter {
  show: boolean;
  title: string;
  onClose: () => void;
  onItemClick: (type: string) => void;
}

interface Item {
  id: string;
  name: string;
}

export function AdminTypePickerDialog({
  show,
  title,
  onClose,
  onItemClick,
  ...filter
}: AdminTypePickerDialogProps): JSX.Element {
  const { schema } = useContext(AdminDataDataContext);

  let items: Item[] = [];
  if (schema) {
    items = filterTypeSpecifications(schema, filter).map((it) => ({ id: it.name, name: it.name }));
  }

  return (
    <Dialog show={show} modal width="narrow" onClose={onClose}>
      <Card2>
        <Card2.Header>
          <Card2.HeaderTitle>{title}</Card2.HeaderTitle>
          <Card2.HeaderIconButton icon="close" onClick={onClose} />
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
    </Dialog>
  );
}
