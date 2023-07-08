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
  selector: SchemaPatternSelector | null;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onClose: () => void;
}

const DialogStatus = {
  closed: 'closed',
  invalidFormat: 'invalidFormat',
  noChange: 'noChange',
  valid: 'valid',
} as const;
type DialogStatus = (typeof DialogStatus)[keyof typeof DialogStatus];

const PATTERN_DEFAULT_HELP_TEXT = 'Enter a regular expression pattern.';
const PATTERN_STATUS_HELP_TEST: Record<string, string> = {
  [DialogStatus.invalidFormat]: 'The pattern must be a valid regular expression.',
};

export function EditPatternDialog({
  selector,
  schemaEditorState,
  dispatchSchemaEditorState,
  onClose,
}: Props) {
  const [pattern, setPattern] = useState('');
  const [existingPattern, setExistingPattern] = useState('');
  const [status, setStatus] = useState<DialogStatus>(DialogStatus.closed);

  const handlePatternChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setPattern(event.target.value);
  }, []);

  const handleClose = useCallback(
    async (_event: SyntheticEvent<HTMLDialogElement> | null, returnValue: string) => {
      if (!selector) {
        return;
      }
      if (returnValue === 'ok') {
        dispatchSchemaEditorState(new SchemaEditorActions.ChangePatternPattern(selector, pattern));
      }
      onClose();
      setStatus(DialogStatus.closed);
    },
    [dispatchSchemaEditorState, pattern, onClose, selector],
  );

  useEffect(() => {
    const p = selector
      ? schemaEditorState.patterns.find((it) => it.name === selector.name)?.pattern ?? ''
      : '';
    setPattern(p);
    setExistingPattern(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selector]);

  useEffect(() => {
    const newStatus = selector ? validatePattern(pattern, existingPattern) : DialogStatus.closed;
    setStatus(newStatus);
  }, [pattern, existingPattern, selector]);

  return (
    <Dialog show={!!selector} form modal onClose={handleClose}>
      {selector ? (
        <DialogContent
          {...{
            selector,
            status,
            pattern,
            schemaEditorState,
            onPatternChange: handlePatternChange,
            onEnterKeyPress: () => status === DialogStatus.valid && handleClose(null, 'ok'),
          }}
        />
      ) : null}
    </Dialog>
  );
}

function validatePattern(pattern: string, existingPattern: string): DialogStatus {
  try {
    new RegExp(pattern);
  } catch {
    return DialogStatus.invalidFormat;
  }
  if (pattern === existingPattern) {
    return DialogStatus.noChange;
  }
  return DialogStatus.valid;
}

function DialogContent({
  status,
  pattern,
  onPatternChange,
  onEnterKeyPress,
}: {
  selector: SchemaPatternSelector;
  status: DialogStatus;
  pattern: string;
  onPatternChange: ChangeEventHandler<HTMLInputElement>;
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

  const patternColor = status === DialogStatus.invalidFormat ? 'danger' : undefined;

  return (
    <Card>
      <Card.Header>
        <Card.HeaderTitle>Edit pattern</Card.HeaderTitle>
      </Card.Header>
      <Card.Content>
        <Field>
          <Field.Label>Pattern</Field.Label>
          <Field.Control>
            <Input
              placeholder="Enter pattern…"
              color={patternColor}
              value={pattern}
              textStyle="code1"
              onChange={onPatternChange}
              onKeyDown={handleKeyDown}
            />
          </Field.Control>
          <Field.Help color={patternColor}>
            {PATTERN_STATUS_HELP_TEST[status] ?? PATTERN_DEFAULT_HELP_TEXT}
          </Field.Help>
        </Field>
      </Card.Content>
      <Card.Footer>
        <Card.FooterButton>Cancel</Card.FooterButton>
        <Card.FooterButton value="ok" disabled={status !== DialogStatus.valid}>
          Update
        </Card.FooterButton>
      </Card.Footer>
    </Card>
  );
}
