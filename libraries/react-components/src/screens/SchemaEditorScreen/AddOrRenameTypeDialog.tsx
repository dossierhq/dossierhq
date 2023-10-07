import { Card, Dialog, Field, Input, Radio } from '@dossierhq/design';
import type {
  ChangeEvent,
  ChangeEventHandler,
  Dispatch,
  KeyboardEvent,
  SyntheticEvent,
} from 'react';
import { useCallback, useEffect, useState } from 'react';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
  SchemaTypeSelector,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';
import { SchemaEditorActions } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';

interface Props {
  selector: SchemaTypeSelector | 'add' | null;
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

type DialogStatus = (typeof DialogStatus)[keyof typeof DialogStatus];

//TODO move to core?
const PASCAL_CASE_PATTERN = /^[A-Z][a-zA-Z0-9_]*$/;

const NAME_DEFAULT_HELP_TEXT = 'The name of the type, such as MyType';
const NAME_STATUS_HELP_TEST: Record<string, string> = {
  [DialogStatus.invalidFormat]:
    'The name has to start with an uppercase letter (A-Z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as MyType_123',
  [DialogStatus.alreadyExist]: 'A type with that name already exists',
};

export function AddOrRenameTypeDialog({
  selector,
  schemaEditorState,
  dispatchSchemaEditorState,
  onClose,
}: Props) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'entity' | 'component'>('entity');
  const [status, setStatus] = useState<DialogStatus>(DialogStatus.empty);

  const handleKindChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setKind(event.target.value as 'entity' | 'component');
  }, []);

  const handleNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  }, []);

  const handleClose = useCallback(
    async (_event: SyntheticEvent<HTMLDialogElement> | null, returnValue: string) => {
      if (!selector) {
        return;
      }
      if (returnValue === 'ok') {
        if (selector === 'add') {
          dispatchSchemaEditorState(new SchemaEditorActions.AddType(kind, name));
        } else {
          dispatchSchemaEditorState(new SchemaEditorActions.RenameType(selector, name));
        }
      }
      onClose();
      setKind('entity');
      setStatus(DialogStatus.empty);
    },
    [dispatchSchemaEditorState, kind, name, onClose, selector],
  );

  useEffect(() => {
    setName(selector && selector !== 'add' ? selector.typeName : '');
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
            selector,
            status,
            name,
            kind,
            schemaEditorState,
            onKindChange: handleKindChange,
            onNameChange: handleNameChange,
            onEnterKeyPress: () => status === DialogStatus.valid && handleClose(null, 'ok'),
          }}
        />
      ) : null}
    </Dialog>
  );
}

function validateName(
  schemaEditorState: SchemaEditorState,
  selector: SchemaTypeSelector | 'add',
  name: string,
): DialogStatus {
  if (!name) return DialogStatus.empty;
  if (!name.match(PASCAL_CASE_PATTERN)) {
    return DialogStatus.invalidFormat;
  }
  if (selector !== 'add' && selector.typeName === name) {
    return DialogStatus.noChange;
  }
  if (
    schemaEditorState.entityTypes.find((it) => it.name === name) ||
    schemaEditorState.componentTypes.find((it) => it.name === name)
  ) {
    return DialogStatus.alreadyExist;
  }
  return DialogStatus.valid;
}

function DialogContent({
  selector,
  status,
  name,
  kind,
  onKindChange,
  onNameChange,
  onEnterKeyPress,
}: {
  selector: SchemaTypeSelector | 'add';
  status: DialogStatus;
  name: string;
  kind: 'entity' | 'component';
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
    [onEnterKeyPress],
  );

  const isRename = selector !== 'add';
  const nameColor = Object.keys(NAME_STATUS_HELP_TEST).includes(status) ? 'danger' : undefined;

  return (
    <Card>
      <Card.Header>
        <Card.HeaderTitle>{isRename ? 'Rename type' : 'Add type'}</Card.HeaderTitle>
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
        {isRename ? null : (
          <Field>
            <Field.Control>
              <Radio name="kind" value="entity" checked={kind === 'entity'} onChange={onKindChange}>
                Entity type
              </Radio>
              <Radio
                name="kind"
                value="component"
                checked={kind === 'component'}
                onChange={onKindChange}
              >
                Component type
              </Radio>
            </Field.Control>
          </Field>
        )}
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
