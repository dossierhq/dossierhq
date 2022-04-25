import { Card, Dialog, Field, Input, Radio } from '@jonasb/datadata-design';
import type { ChangeEvent, ChangeEventHandler, Dispatch, KeyboardEvent } from 'react';
import React, { useCallback, useRef, useState } from 'react';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';
import { SchemaEditorActions } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';

type DialogStatus = 'empty' | 'valid';

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
  const nameRef = useRef('');
  const [kind, setKind] = useState<'entity' | 'value'>('entity');
  const [status, setStatus] = useState<DialogStatus>('empty');

  const handleKindChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setKind(event.target.value as 'entity' | 'value');
  }, []);

  const handleNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      nameRef.current = event.target.value;
      const newStatus = nameRef.current ? 'valid' : 'empty';
      if (newStatus !== status) {
        setStatus(newStatus);
      }
    },
    [status]
  );

  const handleClose = useCallback(
    async (_event: Event, returnValue: string) => {
      if (returnValue === 'add') {
        dispatchSchemaEditorState(new SchemaEditorActions.AddType(kind, nameRef.current));
      }
      onClose();
      setKind('entity');
    },
    [dispatchSchemaEditorState, kind, onClose]
  );

  return (
    <Dialog show={show} modal onClose={handleClose}>
      {show ? (
        <DialogContent
          {...{
            status,
            kind,
            schemaEditorState,
            onKindChange: handleKindChange,
            onNameChange: handleNameChange,
            onEnterKeyPress: () => handleClose(null as unknown as Event, 'add'),
          }}
        />
      ) : null}
    </Dialog>
  );
}

function DialogContent({
  status,
  kind,
  schemaEditorState: _,
  onKindChange,
  onNameChange,
  onEnterKeyPress,
}: {
  status: DialogStatus;
  kind: 'entity' | 'value';
  schemaEditorState: SchemaEditorState;
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

  return (
    <Card>
      <Card.Header>
        <Card.HeaderTitle>Add type</Card.HeaderTitle>
      </Card.Header>
      <Card.Content>
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
        <Field>
          <Input placeholder="Enter name…" onChange={onNameChange} onKeyDown={handleKeyDown} />
        </Field>
      </Card.Content>
      <Card.Footer>
        <Card.FooterButton>Cancel</Card.FooterButton>
        <Card.FooterButton value="add" disabled={status !== 'valid'}>
          Add
        </Card.FooterButton>
      </Card.Footer>
    </Card>
  );
}
