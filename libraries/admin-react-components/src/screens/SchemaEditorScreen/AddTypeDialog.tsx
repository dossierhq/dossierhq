import { Card, Dialog, Field, Input, Radio } from '@jonasb/datadata-design';
import type { ChangeEvent, ChangeEventHandler, Dispatch, KeyboardEvent } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';
import { SchemaEditorActions } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';

const DialogStatus = {
  alreadyExist: 'alreadyExist',
  empty: 'empty',
  invalidFormat: 'invalidFormat',
  valid: 'valid',
} as const;

type DialogStatus = typeof DialogStatus[keyof typeof DialogStatus];

//TODO move to core? add check to core
const NAME_REGEXP = /^[A-Z][a-zA-Z0-9_]*$/;

const NAME_DEFAULT_HELP_TEXT = 'The name of the type, such as MyType';
const NAME_STATUS_HELP_TEST: Record<string, string> = {
  [DialogStatus.invalidFormat]:
    'The name has to start with a letter (A-Z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as MyType_123',
  [DialogStatus.alreadyExist]: 'A type with that name already exists',
};

export function AddTypeDialog({
  show,
  schemaEditorState,
  dispatchSchemaEditorState,
  onClose,
}: {
  show: boolean;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'entity' | 'value'>('entity');
  const [status, setStatus] = useState<DialogStatus>(DialogStatus.empty);

  const handleKindChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setKind(event.target.value as 'entity' | 'value');
  }, []);

  const handleNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  }, []);

  const handleClose = useCallback(
    async (_event: Event, returnValue: string) => {
      if (returnValue === 'add') {
        dispatchSchemaEditorState(new SchemaEditorActions.AddType(kind, name));
      }
      onClose();
      setName('');
      setKind('entity');
      setStatus(DialogStatus.empty);
    },
    [dispatchSchemaEditorState, kind, name, onClose]
  );

  useEffect(() => {
    const newStatus = validateName(schemaEditorState, name);
    setStatus(newStatus);
  }, [name, schemaEditorState]);

  return (
    <Dialog show={show} modal onClose={handleClose}>
      {show ? (
        <DialogContent
          {...{
            status,
            name,
            kind,
            schemaEditorState,
            onKindChange: handleKindChange,
            onNameChange: handleNameChange,
            onEnterKeyPress: () =>
              status === DialogStatus.valid && handleClose(null as unknown as Event, 'add'),
          }}
        />
      ) : null}
    </Dialog>
  );
}

function validateName(schemaEditorState: SchemaEditorState, name: string): DialogStatus {
  if (!name) return DialogStatus.empty;
  if (!name.match(NAME_REGEXP)) {
    return DialogStatus.invalidFormat;
  }
  if (
    schemaEditorState.entityTypes.find((it) => it.name === name) ||
    schemaEditorState.valueTypes.find((it) => it.name === name)
  ) {
    return DialogStatus.alreadyExist;
  }
  return DialogStatus.valid;
}

function DialogContent({
  status,
  name,
  kind,
  onKindChange,
  onNameChange,
  onEnterKeyPress,
}: {
  status: DialogStatus;
  name: string;
  kind: 'entity' | 'value';
  onKindChange: ChangeEventHandler<HTMLInputElement>;
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

  const nameColor = Object.keys(NAME_STATUS_HELP_TEST).includes(status) ? 'danger' : undefined;

  return (
    <Card>
      <Card.Header>
        <Card.HeaderTitle>Add type</Card.HeaderTitle>
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
        <Field>
          <Field.Control>
            <Radio name="kind" value="entity" checked={kind === 'entity'} onChange={onKindChange}>
              Entity type
            </Radio>
            <Radio name="kind" value="value" checked={kind === 'value'} onChange={onKindChange}>
              Value type
            </Radio>
          </Field.Control>
        </Field>
      </Card.Content>
      <Card.Footer>
        <Card.FooterButton>Cancel</Card.FooterButton>
        <Card.FooterButton value="add" disabled={status !== DialogStatus.valid}>
          Add
        </Card.FooterButton>
      </Card.Footer>
    </Card>
  );
}
