import { ErrorType } from '@dossierhq/core';
import { useContext, useMemo, useState, type Dispatch, type KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { DossierContext } from '../contexts/DossierContext.js';
import {
  getSchemaSpecificationUpdateFromEditorState,
  SchemaEditorActions,
  type SchemaEditorState,
  type SchemaEditorStateAction,
  type SchemaFieldSelector,
  type SchemaIndexSelector,
  type SchemaPatternSelector,
  type SchemaTypeSelector,
} from '../reducers/SchemaEditorReducer.js';
import { assertIsDefined } from '../utils/AssertUtils.js';
import { Button } from './ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';
import { Input } from './ui/input.js';
import { Label } from './ui/label.js';
import { Textarea } from './ui/textarea.js';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group.js';

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
const CAMEL_CASE_PATTERN = /^[a-z][a-zA-Z0-9_]*$/;

interface NameDialogConfig {
  addTitle: string;
  renameTitle: string;
  defaultHelpText: string;
  statusHelpTexts: Partial<Record<DialogStatus, string>>;
}

const TYPE_DIALOG_CONFIG: NameDialogConfig = {
  addTitle: 'Add type',
  renameTitle: 'Rename type',
  defaultHelpText: 'The name of the type, such as MyType',
  statusHelpTexts: {
    [DialogStatus.invalidFormat]:
      'The name has to start with an uppercase letter (A-Z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as MyType_123',
    [DialogStatus.alreadyExist]: 'A type with that name already exists',
  },
};

const FIELD_DIALOG_CONFIG: NameDialogConfig = {
  addTitle: 'Add field',
  renameTitle: 'Rename field',
  defaultHelpText: 'The name of the field, such as myField',
  statusHelpTexts: {
    [DialogStatus.invalidFormat]:
      'The name has to start with a lower-case letter (a-z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as myField_123',
    [DialogStatus.alreadyExist]: 'A field with that name already exists in the type',
  },
};

const INDEX_DIALOG_CONFIG: NameDialogConfig = {
  addTitle: 'Add index',
  renameTitle: 'Rename index',
  defaultHelpText: 'The name of the index, such as myIndex',
  statusHelpTexts: {
    [DialogStatus.invalidFormat]:
      'The index name has to start with a lower-case letter (a-z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as myIndex_123',
    [DialogStatus.alreadyExist]: 'An index with that name already exists',
  },
};

const PATTERN_DIALOG_CONFIG: NameDialogConfig = {
  addTitle: 'Add pattern',
  renameTitle: 'Rename pattern',
  defaultHelpText: 'The name of the pattern, such as myPattern',
  statusHelpTexts: {
    [DialogStatus.invalidFormat]:
      'The name has to start with a lower-case letter (a-z) and can only contain letters (a-z, A-Z), numbers and underscore (_), such as myPattern_123',
    [DialogStatus.alreadyExist]: 'A pattern with that name already exists',
  },
};

// ADD OR RENAME TYPE

export function AddOrRenameTypeDialog({
  selector,
  schemaEditorState,
  dispatchSchemaEditorState,
  onClose,
}: {
  selector: SchemaTypeSelector | 'add' | null;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onClose: () => void;
}) {
  if (!selector) {
    return null;
  }
  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent>
        <AddOrRenameTypeDialogContent
          selector={selector}
          schemaEditorState={schemaEditorState}
          dispatchSchemaEditorState={dispatchSchemaEditorState}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddOrRenameTypeDialogContent({
  selector,
  schemaEditorState,
  dispatchSchemaEditorState,
  onClose,
}: {
  selector: SchemaTypeSelector | 'add';
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onClose: () => void;
}) {
  const [name, setName] = useState(selector !== 'add' ? selector.typeName : '');
  const [kind, setKind] = useState<'entity' | 'component'>('entity');

  const isRename = selector !== 'add';
  const status = validateTypeName(schemaEditorState, selector, name);

  const handleSubmit = () => {
    if (status !== DialogStatus.valid) {
      return;
    }
    if (selector === 'add') {
      dispatchSchemaEditorState(new SchemaEditorActions.AddType(kind, name));
    } else {
      dispatchSchemaEditorState(new SchemaEditorActions.RenameType(selector, name));
    }
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isRename ? 'Rename type' : 'Add type'}</DialogTitle>
      </DialogHeader>
      <NameField
        config={TYPE_DIALOG_CONFIG}
        status={status}
        name={name}
        onNameChange={setName}
        onSubmit={handleSubmit}
      />
      {isRename ? null : (
        <ToggleGroup
          type="single"
          variant="outline"
          value={kind}
          onValueChange={(value) => {
            if (value === 'entity' || value === 'component') {
              setKind(value);
            }
          }}
        >
          <ToggleGroupItem value="entity">Entity type</ToggleGroupItem>
          <ToggleGroupItem value="component">Component type</ToggleGroupItem>
        </ToggleGroup>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={status !== DialogStatus.valid} onClick={handleSubmit}>
          {isRename ? 'Rename' : 'Add'}
        </Button>
      </DialogFooter>
    </>
  );
}

function validateTypeName(
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

// ADD OR RENAME FIELD

export function AddOrRenameFieldDialog({
  selector,
  schemaEditorState,
  dispatchSchemaEditorState,
  onClose,
}: {
  selector: SchemaFieldSelector | SchemaTypeSelector | null;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onClose: () => void;
}) {
  if (!selector) {
    return null;
  }
  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent>
        <AddOrRenameFieldDialogContent
          selector={selector}
          schemaEditorState={schemaEditorState}
          dispatchSchemaEditorState={dispatchSchemaEditorState}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddOrRenameFieldDialogContent({
  selector,
  schemaEditorState,
  dispatchSchemaEditorState,
  onClose,
}: {
  selector: SchemaFieldSelector | SchemaTypeSelector;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onClose: () => void;
}) {
  const isRename = 'fieldName' in selector;
  const [name, setName] = useState(isRename ? selector.fieldName : '');

  const status = validateFieldName(schemaEditorState, selector, name);

  const handleSubmit = () => {
    if (status !== DialogStatus.valid) {
      return;
    }
    if ('fieldName' in selector) {
      dispatchSchemaEditorState(new SchemaEditorActions.RenameField(selector, name));
    } else {
      dispatchSchemaEditorState(new SchemaEditorActions.AddField(selector, name));
    }
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isRename ? 'Rename field' : 'Add field'}</DialogTitle>
      </DialogHeader>
      <NameField
        config={FIELD_DIALOG_CONFIG}
        status={status}
        name={name}
        onNameChange={setName}
        onSubmit={handleSubmit}
      />
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={status !== DialogStatus.valid} onClick={handleSubmit}>
          {isRename ? 'Rename' : 'Add'}
        </Button>
      </DialogFooter>
    </>
  );
}

function validateFieldName(
  schemaEditorState: SchemaEditorState,
  selector: SchemaFieldSelector | SchemaTypeSelector,
  name: string,
): DialogStatus {
  if (!name) return DialogStatus.empty;
  if (!name.match(CAMEL_CASE_PATTERN)) {
    return DialogStatus.invalidFormat;
  }
  if ('fieldName' in selector && selector.fieldName === name) {
    return DialogStatus.noChange;
  }
  const typeDraft =
    selector.kind === 'entity'
      ? schemaEditorState.entityTypes.find((it) => it.name === selector.typeName)
      : schemaEditorState.componentTypes.find((it) => it.name === selector.typeName);
  assertIsDefined(typeDraft);
  if (typeDraft.fields.find((it) => it.name === name)) {
    return DialogStatus.alreadyExist;
  }
  return DialogStatus.valid;
}

// ADD OR RENAME INDEX

export function AddOrRenameIndexDialog({
  selector,
  schemaEditorState,
  dispatchSchemaEditorState,
  onClose,
}: {
  selector: SchemaIndexSelector | 'add' | null;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onClose: () => void;
}) {
  if (!selector) {
    return null;
  }
  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent>
        <AddOrRenameIndexDialogContent
          selector={selector}
          schemaEditorState={schemaEditorState}
          dispatchSchemaEditorState={dispatchSchemaEditorState}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddOrRenameIndexDialogContent({
  selector,
  schemaEditorState,
  dispatchSchemaEditorState,
  onClose,
}: {
  selector: SchemaIndexSelector | 'add';
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onClose: () => void;
}) {
  const isRename = selector !== 'add';
  const [name, setName] = useState(isRename ? selector.name : '');

  const status = validateIndexName(schemaEditorState, selector, name);

  const handleSubmit = () => {
    if (status !== DialogStatus.valid) {
      return;
    }
    if (selector === 'add') {
      dispatchSchemaEditorState(new SchemaEditorActions.AddIndex(name));
    } else {
      dispatchSchemaEditorState(new SchemaEditorActions.RenameIndex(selector, name));
    }
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isRename ? 'Rename index' : 'Add index'}</DialogTitle>
      </DialogHeader>
      <NameField
        config={INDEX_DIALOG_CONFIG}
        status={status}
        name={name}
        onNameChange={setName}
        onSubmit={handleSubmit}
      />
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={status !== DialogStatus.valid} onClick={handleSubmit}>
          {isRename ? 'Rename' : 'Add'}
        </Button>
      </DialogFooter>
    </>
  );
}

function validateIndexName(
  schemaEditorState: SchemaEditorState,
  selector: SchemaIndexSelector | 'add',
  name: string,
): DialogStatus {
  if (!name) return DialogStatus.empty;
  if (!name.match(CAMEL_CASE_PATTERN)) {
    return DialogStatus.invalidFormat;
  }
  if (selector !== 'add' && selector.name === name) {
    return DialogStatus.noChange;
  }
  if (schemaEditorState.indexes.find((it) => it.name === name)) {
    return DialogStatus.alreadyExist;
  }
  return DialogStatus.valid;
}

// ADD OR RENAME PATTERN

export function AddOrRenamePatternDialog({
  selector,
  schemaEditorState,
  dispatchSchemaEditorState,
  onClose,
}: {
  selector: SchemaPatternSelector | 'add' | null;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onClose: () => void;
}) {
  if (!selector) {
    return null;
  }
  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent>
        <AddOrRenamePatternDialogContent
          selector={selector}
          schemaEditorState={schemaEditorState}
          dispatchSchemaEditorState={dispatchSchemaEditorState}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddOrRenamePatternDialogContent({
  selector,
  schemaEditorState,
  dispatchSchemaEditorState,
  onClose,
}: {
  selector: SchemaPatternSelector | 'add';
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onClose: () => void;
}) {
  const isRename = selector !== 'add';
  const [name, setName] = useState(isRename ? selector.name : '');

  const status = validatePatternName(schemaEditorState, selector, name);

  const handleSubmit = () => {
    if (status !== DialogStatus.valid) {
      return;
    }
    if (selector === 'add') {
      dispatchSchemaEditorState(new SchemaEditorActions.AddPattern(name));
    } else {
      dispatchSchemaEditorState(new SchemaEditorActions.RenamePattern(selector, name));
    }
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isRename ? 'Rename pattern' : 'Add pattern'}</DialogTitle>
      </DialogHeader>
      <NameField
        config={PATTERN_DIALOG_CONFIG}
        status={status}
        name={name}
        onNameChange={setName}
        onSubmit={handleSubmit}
      />
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={status !== DialogStatus.valid} onClick={handleSubmit}>
          {isRename ? 'Rename' : 'Add'}
        </Button>
      </DialogFooter>
    </>
  );
}

function validatePatternName(
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

// SHARED NAME FIELD

function NameField({
  config,
  status,
  name,
  onNameChange,
  onSubmit,
}: {
  config: NameDialogConfig;
  status: DialogStatus;
  name: string;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
}) {
  const isError = status in config.statusHelpTexts;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor="schema-editor-name">Name</Label>
      <Input
        id="schema-editor-name"
        placeholder="Enter name…"
        autoFocus
        aria-invalid={isError}
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <p className={isError ? 'text-destructive text-sm' : 'text-muted-foreground text-sm'}>
        {config.statusHelpTexts[status] ?? config.defaultHelpText}
      </p>
    </div>
  );
}

// EDIT PATTERN

const EditPatternDialogStatus = {
  invalidFormat: 'invalidFormat',
  noChange: 'noChange',
  valid: 'valid',
} as const;
type EditPatternDialogStatus =
  (typeof EditPatternDialogStatus)[keyof typeof EditPatternDialogStatus];

const PATTERN_DEFAULT_HELP_TEXT = 'Enter a regular expression pattern.';
const PATTERN_STATUS_HELP_TEXTS: Partial<Record<EditPatternDialogStatus, string>> = {
  [EditPatternDialogStatus.invalidFormat]: 'The pattern must be a valid regular expression.',
};

export function EditPatternDialog({
  selector,
  schemaEditorState,
  dispatchSchemaEditorState,
  onClose,
}: {
  selector: SchemaPatternSelector | null;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onClose: () => void;
}) {
  if (!selector) {
    return null;
  }
  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent>
        <EditPatternDialogContent
          selector={selector}
          schemaEditorState={schemaEditorState}
          dispatchSchemaEditorState={dispatchSchemaEditorState}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditPatternDialogContent({
  selector,
  schemaEditorState,
  dispatchSchemaEditorState,
  onClose,
}: {
  selector: SchemaPatternSelector;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onClose: () => void;
}) {
  const [existingPattern] = useState(
    () => schemaEditorState.patterns.find((it) => it.name === selector.name)?.pattern ?? '',
  );
  const [pattern, setPattern] = useState(existingPattern);
  const [testString, setTestString] = useState('');

  const status = validatePattern(pattern, existingPattern);

  const regExp = useMemo(() => {
    try {
      return new RegExp(pattern);
    } catch {
      return null;
    }
  }, [pattern]);

  const handleSubmit = () => {
    if (status !== EditPatternDialogStatus.valid) {
      return;
    }
    dispatchSchemaEditorState(new SchemaEditorActions.ChangePatternPattern(selector, pattern));
    onClose();
  };

  const isError = status === EditPatternDialogStatus.invalidFormat;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit pattern</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-1">
        <Label htmlFor="schema-editor-pattern">Pattern</Label>
        <Input
          id="schema-editor-pattern"
          className="font-mono"
          placeholder="Enter pattern…"
          autoFocus
          aria-invalid={isError}
          value={pattern}
          onChange={(event) => setPattern(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleSubmit();
            }
          }}
        />
        <p className={isError ? 'text-destructive text-sm' : 'text-muted-foreground text-sm'}>
          {PATTERN_STATUS_HELP_TEXTS[status] ?? PATTERN_DEFAULT_HELP_TEXT}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="schema-editor-pattern-test">Test string</Label>
        <Input
          id="schema-editor-pattern-test"
          placeholder="Enter a string to test the pattern…"
          value={testString}
          onChange={(event) => setTestString(event.target.value)}
        />
        {testString && regExp ? (
          <p className="text-muted-foreground text-sm">
            {regExp.test(testString) ? 'The string matches the pattern' : 'No match'}
          </p>
        ) : null}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={status !== EditPatternDialogStatus.valid} onClick={handleSubmit}>
          Update
        </Button>
      </DialogFooter>
    </>
  );
}

function validatePattern(pattern: string, existingPattern: string): EditPatternDialogStatus {
  try {
    new RegExp(pattern);
  } catch {
    return EditPatternDialogStatus.invalidFormat;
  }
  if (pattern === existingPattern) {
    return EditPatternDialogStatus.noChange;
  }
  return EditPatternDialogStatus.valid;
}

// SAVE SCHEMA

export function SaveSchemaDialog({
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
  const { client } = useContext(DossierContext);

  const schemaSpecUpdate = useMemo(
    () => (show ? getSchemaSpecificationUpdateFromEditorState(schemaEditorState) : null),
    [schemaEditorState, show],
  );

  if (!show || !schemaSpecUpdate) {
    return null;
  }

  const handleSave = async () => {
    dispatchSchemaEditorState(
      new SchemaEditorActions.SetNextUpdateSchemaSpecificationIsDueToSave(true),
    );

    const result = await client.updateSchemaSpecification(schemaSpecUpdate, {
      includeMigrations: true,
    });
    if (result.isOk()) {
      toast.success('Updated schema.');
    } else {
      toast.error(
        `Failed saving schema. ${
          result.error === ErrorType.BadRequest
            ? result.message
            : `${result.error}: ${result.message}`
        }`,
      );
      dispatchSchemaEditorState(
        new SchemaEditorActions.SetNextUpdateSchemaSpecificationIsDueToSave(false),
      );
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save schema</DialogTitle>
          <DialogDescription>Do you want to save the following changes?</DialogDescription>
        </DialogHeader>
        <Textarea
          readOnly
          className="min-h-[300px] font-mono text-xs"
          defaultValue={JSON.stringify(schemaSpecUpdate, null, 2)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
