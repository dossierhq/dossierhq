import {
  Button,
  ButtonDropdown,
  EmptyStateMessage,
  findAscendantHTMLElement,
  FullscreenContainer,
  Level,
  Text,
  useWindowEventListener,
} from '@dossierhq/design';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { SchemaIndexEditor } from '../../components/SchemaIndexEditor/SchemaIndexEditor.js';
import { SchemaPatternEditor } from '../../components/SchemaPatternEditor/SchemaPatternEditor.js';
import { SchemaTypeEditor } from '../../components/SchemaTypeEditor/SchemaTypeEditor.js';
import { AdminDossierContext } from '../../contexts/AdminDossierContext.js';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
  SchemaEntityTypeDraft,
  SchemaFieldSelector,
  SchemaIndexDraft,
  SchemaIndexSelector,
  SchemaPatternDraft,
  SchemaPatternSelector,
  SchemaTypeSelector,
  SchemaValueTypeDraft,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';
import {
  getElementIdForSelector,
  initializeSchemaEditorState,
  reduceSchemaEditorState,
  SchemaEditorActions,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';
import { AddOrRenameFieldDialog } from './AddOrRenameFieldDialog.js';
import { AddOrRenameIndexDialog } from './AddOrRenameIndexDialog.js';
import { AddOrRenamePatternDialog } from './AddOrRenamePatternDialog.js';
import { AddOrRenameTypeDialog } from './AddOrRenameTypeDialog.js';
import { EditPatternDialog } from './EditPatternDialog.js';
import { SaveSchemaDialog } from './SaveSchemaDialog.js';
import { SchemaMenu } from './SchemaMenu.js';
import { TypeDraftStatusTag } from './TypeDraftStatusTag.js';

export interface SchemaEditorScreenProps {
  header?: ReactNode;
  footer?: ReactNode;
  onEditorHasChangesChange: (hasChanges: boolean) => void;
}

export function SchemaEditorScreen({
  header,
  footer,
  onEditorHasChangesChange,
}: SchemaEditorScreenProps) {
  const { schema } = useContext(AdminDossierContext);
  const [schemaEditorState, dispatchSchemaEditorState] = useReducer(
    reduceSchemaEditorState,
    undefined,
    initializeSchemaEditorState,
  );
  const [addOrRenameTypeSelector, setAddOrRenameTypeSelector] = useState<
    SchemaTypeSelector | 'add' | null
  >(null);
  const [addOrRenameFieldSelector, setAddOrRenameFieldSelector] = useState<
    SchemaFieldSelector | SchemaTypeSelector | null
  >(null);
  const [addOrRenameIndexSelector, setAddOrRenameIndexSelector] = useState<
    SchemaIndexSelector | 'add' | null
  >(null);
  const [addOrRenamePatternSelector, setAddOrRenamePatternSelector] = useState<
    SchemaPatternSelector | 'add' | null
  >(null);
  const [editPatternSelector, setEditPatternSelector] = useState<SchemaPatternSelector | null>(
    null,
  );
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const hasChanges = schemaEditorState.status === 'changed';

  const handleCloseAddTypeDialog = useCallback(() => setAddOrRenameTypeSelector(null), []);
  const handleCloseAddOrRenameFieldDialog = useCallback(
    () => setAddOrRenameFieldSelector(null),
    [],
  );
  const handleCloseAddOrRenameIndexDialog = useCallback(
    () => setAddOrRenameIndexSelector(null),
    [],
  );
  const handleCloseAddOrRenamePatternDialog = useCallback(
    () => setAddOrRenamePatternSelector(null),
    [],
  );
  const handleCloseEditPatternDialog = useCallback(() => setEditPatternSelector(null), []);
  const handleCloseSchemaDialog = useCallback(() => setShowSaveDialog(false), []);

  useEffect(() => {
    if (schema) {
      dispatchSchemaEditorState(new SchemaEditorActions.UpdateSchemaSpecification(schema));
    }
  }, [schema]);

  useEffect(() => {
    onEditorHasChangesChange(hasChanges);
  }, [hasChanges, onEditorHasChangesChange]);

  useSelectorFocused(schemaEditorState, dispatchSchemaEditorState);

  const isEmpty =
    schemaEditorState.entityTypes.length === 0 &&
    schemaEditorState.valueTypes.length === 0 &&
    schemaEditorState.patterns.length === 0;

  const menuScrollToId = getElementIdForSelector(schemaEditorState.activeSelector, 'menuItem');
  const editorScrollToId = getElementIdForSelector(schemaEditorState.activeSelector, 'header');

  return (
    <FullscreenContainer>
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.Columns fillHeight>
        <FullscreenContainer.ScrollableColumn
          width="3/12"
          padding={2}
          gap={2}
          scrollToId={menuScrollToId}
          scrollToIdSignal={schemaEditorState.activeSelectorMenuScrollSignal}
        >
          <Button.Group centered noBottomMargin>
            <Button onClick={() => setAddOrRenameTypeSelector('add')}>Add type</Button>
            <Button onClick={() => setAddOrRenameIndexSelector('add')}>Add index</Button>
            <Button onClick={() => setAddOrRenamePatternSelector('add')}>Add pattern</Button>
          </Button.Group>
          <Button
            disabled={schemaEditorState.status !== 'changed'}
            color="primary"
            onClick={() => setShowSaveDialog(true)}
          >
            Review &amp; save schema
          </Button>
          <SchemaMenu
            schemaEditorState={schemaEditorState}
            dispatchEditorState={dispatchSchemaEditorState}
          />
        </FullscreenContainer.ScrollableColumn>
        <FullscreenContainer.ScrollableColumn
          scrollToId={editorScrollToId}
          scrollToIdSignal={schemaEditorState.activeSelectorEditorScrollSignal}
        >
          {isEmpty ? (
            <EmptyStateMessage
              icon="add"
              title="Schema is empty"
              message="There are no types in the schema"
            />
          ) : (
            <>
              {schemaEditorState.entityTypes.map((entityType) => (
                <TypeEditorRows
                  key={entityType.name}
                  typeDraft={entityType}
                  schemaEditorState={schemaEditorState}
                  dispatchSchemaEditorState={dispatchSchemaEditorState}
                  onAddOrRenameType={setAddOrRenameTypeSelector}
                  onAddOrRenameField={setAddOrRenameFieldSelector}
                />
              ))}
              {schemaEditorState.valueTypes.map((valueType) => (
                <TypeEditorRows
                  key={valueType.name}
                  typeDraft={valueType}
                  schemaEditorState={schemaEditorState}
                  dispatchSchemaEditorState={dispatchSchemaEditorState}
                  onAddOrRenameType={setAddOrRenameTypeSelector}
                  onAddOrRenameField={setAddOrRenameFieldSelector}
                />
              ))}
              {schemaEditorState.indexes.map((indexDraft) => (
                <IndexEditorRows
                  key={indexDraft.name}
                  indexDraft={indexDraft}
                  dispatchSchemaEditorState={dispatchSchemaEditorState}
                />
              ))}
              {schemaEditorState.patterns.map((patternDraft) => (
                <PatternEditorRows
                  key={patternDraft.name}
                  patternDraft={patternDraft}
                  dispatchSchemaEditorState={dispatchSchemaEditorState}
                  onAddOrRenamePattern={setAddOrRenamePatternSelector}
                  onEditPattern={setEditPatternSelector}
                />
              ))}
            </>
          )}
        </FullscreenContainer.ScrollableColumn>
      </FullscreenContainer.Columns>
      {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
      <AddOrRenameTypeDialog
        selector={addOrRenameTypeSelector}
        schemaEditorState={schemaEditorState}
        dispatchSchemaEditorState={dispatchSchemaEditorState}
        onClose={handleCloseAddTypeDialog}
      />
      <AddOrRenameFieldDialog
        selector={addOrRenameFieldSelector}
        schemaEditorState={schemaEditorState}
        dispatchSchemaEditorState={dispatchSchemaEditorState}
        onClose={handleCloseAddOrRenameFieldDialog}
      />
      <AddOrRenameIndexDialog
        selector={addOrRenameIndexSelector}
        schemaEditorState={schemaEditorState}
        dispatchSchemaEditorState={dispatchSchemaEditorState}
        onClose={handleCloseAddOrRenameIndexDialog}
      />
      <AddOrRenamePatternDialog
        selector={addOrRenamePatternSelector}
        schemaEditorState={schemaEditorState}
        dispatchSchemaEditorState={dispatchSchemaEditorState}
        onClose={handleCloseAddOrRenamePatternDialog}
      />
      <EditPatternDialog
        selector={editPatternSelector}
        schemaEditorState={schemaEditorState}
        dispatchSchemaEditorState={dispatchSchemaEditorState}
        onClose={handleCloseEditPatternDialog}
      />
      <SaveSchemaDialog
        show={showSaveDialog}
        schemaEditorState={schemaEditorState}
        dispatchSchemaEditorState={dispatchSchemaEditorState}
        onClose={handleCloseSchemaDialog}
      />
    </FullscreenContainer>
  );
}

function TypeEditorRows({
  typeDraft,
  schemaEditorState,
  dispatchSchemaEditorState,
  onAddOrRenameType,
  onAddOrRenameField,
}: {
  typeDraft: SchemaEntityTypeDraft | SchemaValueTypeDraft;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onAddOrRenameType: (selector: SchemaTypeSelector) => void;
  onAddOrRenameField: (selector: SchemaFieldSelector | SchemaTypeSelector) => void;
}) {
  //TODO support deleting entity type
  const canDeleteType = typeDraft.status === 'new' || typeDraft.kind === 'value';

  const typeSelector = useMemo(
    () => ({ kind: typeDraft.kind, typeName: typeDraft.name }),
    [typeDraft.kind, typeDraft.name],
  );

  const handleClick = useCallback(
    (_event: MouseEvent) =>
      dispatchSchemaEditorState(
        new SchemaEditorActions.SetActiveSelector(typeSelector, true, false),
      ),
    [dispatchSchemaEditorState, typeSelector],
  );

  const dropDownItems = [
    { id: 'rename', title: 'Rename type' },
    { id: 'delete', title: 'Delete type' },
  ] as const;

  const handleDropdownItemClick = useCallback(
    ({ id }: { id: (typeof dropDownItems)[number]['id'] }) => {
      switch (id) {
        case 'delete':
          dispatchSchemaEditorState(new SchemaEditorActions.DeleteType(typeSelector));
          break;
        case 'rename':
          onAddOrRenameType(typeSelector);
          break;
      }
    },
    [dispatchSchemaEditorState, onAddOrRenameType, typeSelector],
  );

  return (
    <>
      <FullscreenContainer.Row id={`${typeDraft.name}-header`} sticky>
        <Level paddingHorizontal={3}>
          <Level.Left>
            <Level.Item>
              <Text textStyle="headline4">
                {typeDraft.name}{' '}
                <Text as="span" textStyle="headline6">
                  {typeDraft.kind === 'entity' ? 'Entity type' : 'Value type'}
                </Text>
              </Text>
            </Level.Item>
          </Level.Left>
          <Level.Right>
            <Level.Item>
              <ButtonDropdown
                items={dropDownItems}
                left
                renderItem={(item) => item.title}
                onItemClick={handleDropdownItemClick}
              />
              {typeDraft.status !== '' ? <TypeDraftStatusTag status={typeDraft.status} /> : null}
            </Level.Item>
          </Level.Right>
        </Level>
      </FullscreenContainer.Row>
      <FullscreenContainer.Row
        gap={2}
        paddingVertical={4}
        paddingHorizontal={3}
        marginBottom={4}
        data-kind={typeDraft.kind}
        data-typename={typeDraft.name}
        onClick={handleClick}
      >
        <SchemaTypeEditor
          typeSelector={typeSelector}
          typeDraft={typeDraft}
          schemaEditorState={schemaEditorState}
          dispatchSchemaEditorState={dispatchSchemaEditorState}
          onAddOrRenameField={onAddOrRenameField}
        />
      </FullscreenContainer.Row>
    </>
  );
}

function IndexEditorRows({
  indexDraft,
  dispatchSchemaEditorState,
}: {
  indexDraft: SchemaIndexDraft;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}) {
  const indexSelector = useMemo(
    () => ({ kind: 'index', name: indexDraft.name }) as const,
    [indexDraft.name],
  );

  const handleClick = useCallback(
    (_event: MouseEvent) =>
      dispatchSchemaEditorState(
        new SchemaEditorActions.SetActiveSelector(indexSelector, true, false),
      ),
    [dispatchSchemaEditorState, indexSelector],
  );

  //TODO support renaming and deleting indexes

  return (
    <>
      <FullscreenContainer.Row id={`index-${indexDraft.name}-header`} sticky>
        <Level paddingHorizontal={3}>
          <Level.Left>
            <Level.Item>
              <Text textStyle="headline4">{indexDraft.name}</Text>
            </Level.Item>
          </Level.Left>
        </Level>
      </FullscreenContainer.Row>
      <FullscreenContainer.Row
        gap={2}
        paddingVertical={4}
        paddingHorizontal={3}
        marginBottom={4}
        data-kind="index"
        data-pattern-name={indexDraft.name}
        onClick={handleClick}
      >
        <SchemaIndexEditor indexDraft={indexDraft} />
      </FullscreenContainer.Row>
    </>
  );
}

function PatternEditorRows({
  patternDraft,
  dispatchSchemaEditorState,
  onAddOrRenamePattern,
  onEditPattern,
}: {
  patternDraft: SchemaPatternDraft;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onAddOrRenamePattern: (selector: SchemaPatternSelector) => void;
  onEditPattern: (selector: SchemaPatternSelector) => void;
}) {
  const patternSelector = useMemo(
    () => ({ kind: 'pattern', name: patternDraft.name }) as const,
    [patternDraft.name],
  );

  const handleClick = useCallback(
    (_event: MouseEvent) =>
      dispatchSchemaEditorState(
        new SchemaEditorActions.SetActiveSelector(patternSelector, true, false),
      ),
    [dispatchSchemaEditorState, patternSelector],
  );

  const handleDropdownItemClick = useCallback(
    ({ id }: { id: string }) => {
      switch (id) {
        case 'delete':
          dispatchSchemaEditorState(new SchemaEditorActions.DeletePattern(patternSelector));
          break;
        case 'rename':
          onAddOrRenamePattern(patternSelector);
          break;
      }
    },
    [dispatchSchemaEditorState, onAddOrRenamePattern, patternSelector],
  );

  const handleEditPattern = useCallback(() => {
    onEditPattern(patternSelector);
  }, [onEditPattern, patternSelector]);

  const dropDownItems = [
    { id: 'rename', title: 'Rename pattern' },
    { id: 'delete', title: 'Delete pattern' },
  ];

  return (
    <>
      <FullscreenContainer.Row id={`pattern-${patternDraft.name}-header`} sticky>
        <Level paddingHorizontal={3}>
          <Level.Left>
            <Level.Item>
              <Text textStyle="headline4">{patternDraft.name}</Text>
            </Level.Item>
          </Level.Left>
          <Level.Right>
            <Level.Item>
              {dropDownItems.length > 0 ? (
                <ButtonDropdown
                  items={dropDownItems}
                  left
                  renderItem={(item) => item.title}
                  onItemClick={handleDropdownItemClick}
                />
              ) : null}
              {patternDraft.status ? <TypeDraftStatusTag status={patternDraft.status} /> : null}
            </Level.Item>
          </Level.Right>
        </Level>
      </FullscreenContainer.Row>
      <FullscreenContainer.Row
        gap={2}
        paddingVertical={4}
        paddingHorizontal={3}
        marginBottom={4}
        data-kind="pattern"
        data-pattern-name={patternDraft.name}
        onClick={handleClick}
      >
        <SchemaPatternEditor patternDraft={patternDraft} onEditPattern={handleEditPattern} />
      </FullscreenContainer.Row>
    </>
  );
}

function useSelectorFocused(
  schemaEditorState: SchemaEditorState,
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>,
) {
  const { activeSelectorEditorScrollSignal } = schemaEditorState;

  const listener = useCallback(
    (event: FocusEvent) => {
      if (event.target instanceof HTMLElement) {
        const selectorElement = findAscendantHTMLElement(
          event.target,
          (el) => !!el.dataset.typename,
        );
        const kind = selectorElement?.dataset.kind;
        const typeName = selectorElement?.dataset.typename;
        const patternName = selectorElement?.dataset['pattern-name'];

        if ((kind === 'entity' || kind === 'value') && typeName) {
          dispatchSchemaEditorState(
            new SchemaEditorActions.SetActiveSelector({ kind, typeName }, true, false),
          );
        } else if (kind === 'pattern' && patternName) {
          dispatchSchemaEditorState(
            new SchemaEditorActions.SetActiveSelector({ kind, name: patternName }, true, false),
          );
        }
      }
    },
    [dispatchSchemaEditorState],
  );
  useWindowEventListener('focusin', listener);

  useEffect(() => {
    if (activeSelectorEditorScrollSignal > 0) {
      window.blur();
    }
  }, [activeSelectorEditorScrollSignal]);
}
