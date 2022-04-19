import {
  Button,
  EmptyStateMessage,
  findAscendantHTMLElement,
  FullscreenContainer,
  Level,
  Text,
  useWindowEventListener,
} from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React, { useCallback, useContext, useEffect, useReducer, useState } from 'react';
import { DataDataContext2 } from '../..';
import { SchemaTypeEditor } from '../../components/SchemaTypeEditor/SchemaTypeEditor';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
  SchemaEntityTypeDraft,
  SchemaValueTypeDraft,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';
import {
  initializeSchemaEditorState,
  reduceSchemaEditorState,
  SchemaEditorActions,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';
import { AddTypeButton } from './AddTypeButton';
import { SaveSchemaDialog } from './SaveSchemaDialog';
import { SchemaMenu } from './SchemaMenu';
import { TypeDraftStatusTag } from './TypeDraftStatusTag';

export interface SchemaEditorScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function SchemaEditorScreen({ header, footer }: SchemaEditorScreenProps) {
  const { schema } = useContext(DataDataContext2);
  const [schemaEditorState, dispatchSchemaEditorState] = useReducer(
    reduceSchemaEditorState,
    undefined,
    initializeSchemaEditorState
  );
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    if (schema) {
      dispatchSchemaEditorState(new SchemaEditorActions.UpdateSchemaSpecification(schema));
    }
  }, [schema]);

  useSelectorFocused(schemaEditorState, dispatchSchemaEditorState);

  const isEmpty =
    schemaEditorState.entityTypes.length === 0 && schemaEditorState.valueTypes.length === 0;

  const scrollToId = schemaEditorState.activeSelector
    ? `${schemaEditorState.activeSelector.typeName}-header`
    : undefined;

  return (
    <FullscreenContainer>
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.Columns fillHeight>
        <FullscreenContainer.ScrollableColumn width="3/12" padding={2} gap={2}>
          <AddTypeButton
            type="entity"
            disabled={!schema}
            dispatchSchemaEditorState={dispatchSchemaEditorState}
          >
            Add entity type
          </AddTypeButton>
          <AddTypeButton
            type="value"
            disabled={!schema}
            dispatchSchemaEditorState={dispatchSchemaEditorState}
          >
            Add value type
          </AddTypeButton>
          <Button
            disabled={schemaEditorState.status !== 'changed'}
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
          scrollToId={scrollToId}
          scrollToIdSignal={schemaEditorState.activeSelectorScrollSignal}
        >
          {isEmpty ? (
            <EmptyStateMessage
              icon="add"
              title="Schema is empty"
              message="There are no types in the schema."
            />
          ) : (
            <>
              {schemaEditorState.entityTypes.map((entityType) => (
                <TypeEditorRows
                  key={entityType.name}
                  typeDraft={entityType}
                  schemaEditorState={schemaEditorState}
                  dispatchSchemaEditorState={dispatchSchemaEditorState}
                />
              ))}
              {schemaEditorState.valueTypes.map((valueType) => (
                <TypeEditorRows
                  key={valueType.name}
                  typeDraft={valueType}
                  schemaEditorState={schemaEditorState}
                  dispatchSchemaEditorState={dispatchSchemaEditorState}
                />
              ))}
            </>
          )}
        </FullscreenContainer.ScrollableColumn>
      </FullscreenContainer.Columns>
      {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
      <SaveSchemaDialog
        show={showSaveDialog}
        schemaEditorState={schemaEditorState}
        dispatchSchemaEditorState={dispatchSchemaEditorState}
        onClose={() => setShowSaveDialog(false)}
      />
    </FullscreenContainer>
  );
}

function TypeEditorRows({
  typeDraft,
  schemaEditorState,
  dispatchSchemaEditorState,
}: {
  typeDraft: SchemaEntityTypeDraft | SchemaValueTypeDraft;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}) {
  return (
    <>
      <FullscreenContainer.Row id={`${typeDraft.name}-header`} sticky>
        <Level>
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
                <TypeDraftStatusTag status={typeDraft.status} />
              </Level.Item>
            </Level.Right>
          ) : null}
        </Level>
      </FullscreenContainer.Row>
      <FullscreenContainer.Row gap={2} paddingVertical={3}>
        <SchemaTypeEditor
          typeDraft={typeDraft}
          schemaEditorState={schemaEditorState}
          dispatchSchemaEditorState={dispatchSchemaEditorState}
        />
      </FullscreenContainer.Row>
    </>
  );
}

function useSelectorFocused(
  schemaEditorState: SchemaEditorState,
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>
) {
  const { activeSelectorScrollSignal } = schemaEditorState;

  const listener = useCallback(
    (event: FocusEvent) => {
      if (event.target instanceof HTMLElement) {
        const selectorElement = findAscendantHTMLElement(
          event.target,
          (el) => !!el.dataset.typename
        );
        const kind = selectorElement?.dataset.kind;
        const typeName = selectorElement?.dataset.typename;
        const fieldName = selectorElement?.dataset.fieldname;

        if ((kind === 'entity' || kind === 'value') && typeName) {
          dispatchSchemaEditorState(
            new SchemaEditorActions.SetActiveSelector(
              fieldName ? { kind, typeName, fieldName } : { kind, typeName },
              false
            )
          );
        }
      }
    },
    [dispatchSchemaEditorState]
  );
  useWindowEventListener('focusin', listener);

  useEffect(() => {
    if (activeSelectorScrollSignal > 0) {
      window.blur();
    }
  }, [activeSelectorScrollSignal]);
}
