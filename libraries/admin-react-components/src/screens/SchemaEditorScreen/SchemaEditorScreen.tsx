import {
  Button,
  ButtonDropdown,
  EmptyStateMessage,
  findAscendantHTMLElement,
  FullscreenContainer,
  Level,
  Text,
  useWindowEventListener,
} from '@jonasb/datadata-design';
import type { Dispatch, MouseEvent } from 'react';
import React, { useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { AdminDataDataContext } from '../..';
import { SchemaTypeEditor } from '../../components/SchemaTypeEditor/SchemaTypeEditor';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
  SchemaEntityTypeDraft,
  SchemaFieldSelector,
  SchemaPatternSelector,
  SchemaTypeSelector,
  SchemaValueTypeDraft,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';
import {
  initializeSchemaEditorState,
  reduceSchemaEditorState,
  SchemaEditorActions,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';
import { AddOrRenameFieldDialog } from './AddOrRenameFieldDialog';
import { AddOrRenameTypeDialog } from './AddOrRenameTypeDialog';
import { SaveSchemaDialog } from './SaveSchemaDialog';
import { SchemaMenu } from './SchemaMenu';
import { TypeDraftStatusTag } from './TypeDraftStatusTag';

export interface SchemaEditorScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onEditorHasChangesChange: (hasChanges: boolean) => void;
}

export function SchemaEditorScreen({
  header,
  footer,
  onEditorHasChangesChange,
}: SchemaEditorScreenProps) {
  const { schema } = useContext(AdminDataDataContext);
  const [schemaEditorState, dispatchSchemaEditorState] = useReducer(
    reduceSchemaEditorState,
    undefined,
    initializeSchemaEditorState
  );
  const [addOrRenameTypeSelector, setAddOrRenameTypeSelector] = useState<
    SchemaTypeSelector | 'add' | null
  >(null);
  const [addOrRenameFieldSelector, setAddOrRenameFieldSelector] = useState<
    SchemaFieldSelector | SchemaTypeSelector | null
  >(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const hasChanges = schemaEditorState.status === 'changed';

  const handleCloseAddTypeDialog = useCallback(() => setAddOrRenameTypeSelector(null), []);
  const handleCloseAddOrRenameFieldDialog = useCallback(
    () => setAddOrRenameFieldSelector(null),
    []
  );
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
    schemaEditorState.entityTypes.length === 0 && schemaEditorState.valueTypes.length === 0;

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
          <Button onClick={() => setAddOrRenameTypeSelector('add')}>Add type</Button>
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
  const canDeleteOrRenameType = typeDraft.status === 'new'; //TODO too restrictive

  const typeSelector = useMemo(
    () => ({ kind: typeDraft.kind, typeName: typeDraft.name }),
    [typeDraft.kind, typeDraft.name]
  );

  const handleClick = useCallback(
    (_event: MouseEvent) =>
      dispatchSchemaEditorState(
        new SchemaEditorActions.SetActiveSelector(typeSelector, true, false)
      ),
    [dispatchSchemaEditorState, typeSelector]
  );

  const handleDropdownItemClick = useCallback(
    ({ id }: { id: string }) => {
      switch (id) {
        case 'delete':
          dispatchSchemaEditorState(new SchemaEditorActions.DeleteType(typeSelector));
          break;
        case 'rename':
          onAddOrRenameType(typeSelector);
          break;
      }
    },
    [dispatchSchemaEditorState, onAddOrRenameType, typeSelector]
  );

  const dropDownItems = canDeleteOrRenameType
    ? [
        { id: 'rename', title: 'Rename type' },
        { id: 'delete', title: 'Delete type' },
      ]
    : [];

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
          {typeDraft.status !== '' ? (
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
                <TypeDraftStatusTag status={typeDraft.status} />
              </Level.Item>
            </Level.Right>
          ) : null}
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

function getElementIdForSelector(
  selector: SchemaTypeSelector | SchemaPatternSelector | null,
  section: 'menuItem' | 'header'
) {
  if (!selector) {
    return undefined;
  }
  if (selector.kind === 'pattern') {
    return `pattern-${selector.name}-${section}`;
  }
  return `${selector.typeName}-${section}`;
}

function useSelectorFocused(
  schemaEditorState: SchemaEditorState,
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>
) {
  const { activeSelectorEditorScrollSignal } = schemaEditorState;

  const listener = useCallback(
    (event: FocusEvent) => {
      if (event.target instanceof HTMLElement) {
        const selectorElement = findAscendantHTMLElement(
          event.target,
          (el) => !!el.dataset.typename
        );
        const kind = selectorElement?.dataset.kind;
        const typeName = selectorElement?.dataset.typename;

        if ((kind === 'entity' || kind === 'value') && typeName) {
          dispatchSchemaEditorState(
            new SchemaEditorActions.SetActiveSelector({ kind, typeName }, true, false)
          );
        }
      }
    },
    [dispatchSchemaEditorState]
  );
  useWindowEventListener('focusin', listener);

  useEffect(() => {
    if (activeSelectorEditorScrollSignal > 0) {
      window.blur();
    }
  }, [activeSelectorEditorScrollSignal]);
}
