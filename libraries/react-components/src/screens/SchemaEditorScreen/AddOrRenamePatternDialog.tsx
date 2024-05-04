import { Card, Dialog, Field, Input } from '@dossierhq/design';
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type ChangeEventHandler,
  type Dispatch,
  type KeyboardEvent,
  type SyntheticEvent,
} from 'react';
import {
  SchemaEditorActions,
  type SchemaEditorState,
  type SchemaEditorStateAction,
  type SchemaPatternSelector,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';

interface Props {
  selector: SchemaPatternSelector | 'add' | null;
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

//TODO use from core?
const CAMEL_CASE_PATTERN = /^[a-z][a-zA-Z0-9_]*$/;

const NAME_DEFAULT_HELP_TEXT = 'The name of the pattern, such as myPattern';
const NAME_STATUS_HELP_TEST: Record<string, string> = {
  [DialogStatus.invalidFormat]:
    'The name has to start with a lower-case letter (a-z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as myPattern_123',
  [DialogStatus.alreadyExist]: 'A pattern with that name already exists',
};

export function AddOrRenamePatternDialog({
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
    async (_event: SyntheticEvent<HTMLDialogElement> | null, returnValue: string) => {
      if (!selector) {
        return;
      }
      if (returnValue === 'ok') {
        if (selector === 'add') {
          dispatchSchemaEditorState(new SchemaEditorActions.AddPattern(name));
        } else {
          dispatchSchemaEditorState(new SchemaEditorActions.RenamePattern(selector, name));
        }
      }
      onClose();
      setStatus(DialogStatus.empty);
    },
    [dispatchSchemaEditorState, name, onClose, selector],
  );

  useEffect(() => {
    setName(selector && selector !== 'add' ? selector.name : '');
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
            schemaEditorState,
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
  selector: SchemaPatternSelector | 'add',
  name: string,
): DialogStatus {
  if (!name) return DialogStatus.empty;
  if (!name.match(CAMEL_CASE_PATTERN)) {
    return DialogStatus.invalidFormat;
  }
  if (selector !== 'add' && selector.name === name) {
    return DialogStatus.noChange;
  }
  if (schemaEditorState.patterns.find((it) => it.name === name)) {
    return DialogStatus.alreadyExist;
  }
  return DialogStatus.valid;
}

function DialogContent({
  selector,
  status,
  name,
  onNameChange,
  onEnterKeyPress,
}: {
  selector: SchemaPatternSelector | 'add';
  status: DialogStatus;
  name: string;
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
        <Card.HeaderTitle>{isRename ? 'Rename pattern' : 'Add pattern'}</Card.HeaderTitle>
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
