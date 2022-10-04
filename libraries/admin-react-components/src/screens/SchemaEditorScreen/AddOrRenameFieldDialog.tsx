import { assertIsDefined } from '@jonasb/datadata-core';
import { Card, Dialog, Field, Input } from '@jonasb/datadata-design';
import type { ChangeEvent, ChangeEventHandler, Dispatch, KeyboardEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
  SchemaFieldSelector,
  SchemaTypeSelector,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';
import { SchemaEditorActions } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';

interface Props {
  selector: SchemaFieldSelector | SchemaTypeSelector | null;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onClose: () => void;
}

const DialogStatus = {
  alreadyExist: 'alreadyExist',
  empty: 'empty',
  invalidFormat: 'invalidFormat',
  noChange: 'noChange',
  valid: 'valid',
} as const;

type DialogStatus = typeof DialogStatus[keyof typeof DialogStatus];

//TODO move to core? add check to core
const NAME_REGEXP = /^[a-z][a-zA-Z0-9_]*$/;

const NAME_DEFAULT_HELP_TEXT = 'The name of the field, such as myField';
const NAME_STATUS_HELP_TEST: Record<string, string> = {
  [DialogStatus.invalidFormat]:
    'The name has to start with a lower-case letter (a-z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as myField_123',
  [DialogStatus.alreadyExist]: 'A field with that name already exists in the type',
};

export function AddOrRenameFieldDialog({
  selector,
  schemaEditorState,
  dispatchSchemaEditorState,
  onClose,
}: Props) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<DialogStatus>(DialogStatus.empty);

  const handleNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  }, []);

  const handleClose = useCallback(
    async (_event: Event, returnValue: string) => {
      if (!selector) {
        return;
      }
      if (returnValue === 'ok') {
        if ('fieldName' in selector) {
          dispatchSchemaEditorState(new SchemaEditorActions.RenameField(selector, name));
        } else {
          dispatchSchemaEditorState(new SchemaEditorActions.AddField(selector, name));
        }
      }
      onClose();
    },
    [dispatchSchemaEditorState, name, onClose, selector]
  );

  useEffect(() => {
    setName(selector && 'fieldName' in selector ? selector.fieldName : '');
  }, [selector]);

  useEffect(() => {
    const newStatus = selector
      ? validateName(schemaEditorState, selector, name)
      : DialogStatus.empty;
    setStatus(newStatus);
  }, [name, schemaEditorState, selector]);

  return (
    <Dialog show={!!selector} form modal onClose={handleClose}>
      {selector ? (
        <DialogContent
          {...{
            status,
            name,
            selector,
            schemaEditorState,
            onNameChange: handleNameChange,
            onEnterKeyPress: () =>
              status === DialogStatus.valid && handleClose(null as unknown as Event, 'ok'),
          }}
        />
      ) : null}
    </Dialog>
  );
}

function validateName(
  schemaEditorState: SchemaEditorState,
  selector: SchemaFieldSelector | SchemaTypeSelector,
  name: string
): DialogStatus {
  if (!name) return DialogStatus.empty;
  if (!name.match(NAME_REGEXP)) {
    return DialogStatus.invalidFormat;
  }
  if ('fieldName' in selector && selector.fieldName === name) {
    return DialogStatus.noChange;
  }
  const typeDraft =
    selector.kind === 'entity'
      ? schemaEditorState.entityTypes.find((it) => it.name === selector.typeName)
      : schemaEditorState.valueTypes.find((it) => it.name === selector.typeName);
  assertIsDefined(typeDraft);
  if (typeDraft.fields.find((it) => it.name === name)) {
    return DialogStatus.alreadyExist;
  }
  return DialogStatus.valid;
}

function DialogContent({
  status,
  name,
  selector,
  onNameChange,
  onEnterKeyPress,
}: {
  status: DialogStatus;
  name: string;
  selector: SchemaFieldSelector | SchemaTypeSelector;
  onNameChange: ChangeEventHandler<HTMLInputElement>;
  onEnterKeyPress: () => void;
}) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        onEnterKeyPress();
      }
    },
    [onEnterKeyPress]
  );

  const isRename = 'fieldName' in selector;
  const nameColor = Object.keys(NAME_STATUS_HELP_TEST).includes(status) ? 'danger' : undefined;

  return (
    <Card>
      <Card.Header>
        <Card.HeaderTitle>{isRename ? 'Rename field' : 'Add field'}</Card.HeaderTitle>
      </Card.Header>
      <Card.Content>
        <Field>
          <Field.Label>Name</Field.Label>
          <Field.Control>
            <Input
              placeholder="Enter name…"
              color={nameColor}
              value={name}
              onChange={onNameChange}
              onKeyDown={handleKeyDown}
            />
          </Field.Control>
          <Field.Help color={nameColor}>
            {NAME_STATUS_HELP_TEST[status] ?? NAME_DEFAULT_HELP_TEXT}
          </Field.Help>
        </Field>
      </Card.Content>
      <Card.Footer>
        <Card.FooterButton>Cancel</Card.FooterButton>
        <Card.FooterButton value="ok" disabled={status !== DialogStatus.valid}>
          {isRename ? 'Rename' : 'Add'}
        </Card.FooterButton>
      </Card.Footer>
    </Card>
  );
}
