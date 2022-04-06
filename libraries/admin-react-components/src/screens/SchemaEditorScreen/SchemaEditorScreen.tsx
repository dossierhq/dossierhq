import { AdminSchema } from '@jonasb/datadata-core';
import type { AdminSchemaSpecificationUpdate } from '@jonasb/datadata-core';
import {
  Button,
  Card,
  Dialog,
  EmptyStateMessage,
  FullscreenContainer,
  NotificationContext,
  Text,
  TextArea,
} from '@jonasb/datadata-design';
import type { Dispatch, ReactNode } from 'react';
import React, { useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { useSWRConfig } from 'swr';
import { DataDataContext2 } from '../..';
import { SchemaTypeEditor } from '../../components/SchemaTypeEditor/SchemaTypeEditor';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
  SchemaEntityTypeDraft,
  SchemaValueTypeDraft,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';
import {
  getSchemaSpecificationUpdateFromEditorState,
  initializeSchemaEditorState,
  reduceSchemaEditorState,
  SchemaEditorActions,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';
import { updateCacheSchemas } from '../../utils/CacheUtils';

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

  const isEmpty =
    schemaEditorState.entityTypes.length === 0 && schemaEditorState.valueTypes.length === 0;

  return (
    <FullscreenContainer>
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.ScrollableRow>
        <FullscreenContainer.Row flexDirection="row" paddingVertical={5}>
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
        </FullscreenContainer.Row>
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
                dispatchSchemaEditorState={dispatchSchemaEditorState}
              />
            ))}
            {schemaEditorState.valueTypes.map((valueType) => (
              <TypeEditorRows
                key={valueType.name}
                typeDraft={valueType}
                dispatchSchemaEditorState={dispatchSchemaEditorState}
              />
            ))}
          </>
        )}
      </FullscreenContainer.ScrollableRow>
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

function SaveSchemaDialog({
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
  const { adminClient } = useContext(DataDataContext2);
  const { showNotification } = useContext(NotificationContext);
  const { cache, mutate } = useSWRConfig();

  const schemaSpecUpdate = useMemo(
    () => (show ? getSchemaSpecificationUpdateFromEditorState(schemaEditorState) : null),
    [schemaEditorState, show]
  );

  const handleClose = useCallback(
    async (event: Event, returnValue: string) => {
      if (returnValue === 'save' && schemaSpecUpdate) {
        const result = await adminClient.updateSchemaSpecification(schemaSpecUpdate);
        if (result.isOk()) {
          showNotification({ color: 'success', message: 'Updated schema.' });
          const adminSchema = new AdminSchema(result.value.schemaSpecification);
          dispatchSchemaEditorState(
            new SchemaEditorActions.UpdateSchemaSpecification(adminSchema, { force: true })
          );
          updateCacheSchemas(cache, mutate, adminSchema);
        } else {
          showNotification({ color: 'error', message: 'Failed saving schema.' });
        }
      }
      onClose();
    },
    [
      adminClient,
      cache,
      dispatchSchemaEditorState,
      mutate,
      onClose,
      schemaSpecUpdate,
      showNotification,
    ]
  );

  return (
    <Dialog show={show} modal onClose={handleClose}>
      {show && schemaSpecUpdate ? (
        <SaveSchemaDialogContent schemaSpecUpdate={schemaSpecUpdate} />
      ) : null}
    </Dialog>
  );
}

function SaveSchemaDialogContent({
  schemaSpecUpdate,
}: {
  schemaSpecUpdate: AdminSchemaSpecificationUpdate;
}) {
  return (
    <Card>
      <Card.Header>Save schema</Card.Header>
      <Card.Content>
        <Text textStyle="body1">Do you want to save the following changes?</Text>
        <TextArea fixedSize textStyle="code2" readOnly style={{ minHeight: '300px' }}>
          {JSON.stringify(schemaSpecUpdate, null, 2)}
        </TextArea>
      </Card.Content>
      <Card.Footer>
        <Card.FooterButton>Cancel</Card.FooterButton>
        <Card.FooterButton value="save">Save</Card.FooterButton>
      </Card.Footer>
    </Card>
  );
}

function AddTypeButton({
  type,
  disabled,
  dispatchSchemaEditorState,
  children,
}: {
  type: 'entity' | 'value';
  disabled: boolean;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  children: ReactNode;
}) {
  const handleClick = useCallback(() => {
    const name = window.prompt('Entity type name?');
    if (name) {
      dispatchSchemaEditorState(new SchemaEditorActions.AddType(type, name));
    }
  }, [dispatchSchemaEditorState, type]);
  return (
    <Button disabled={disabled} onClick={handleClick}>
      {children}
    </Button>
  );
}

function TypeEditorRows({
  typeDraft,
  dispatchSchemaEditorState,
}: {
  typeDraft: SchemaEntityTypeDraft | SchemaValueTypeDraft;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}) {
  return (
    <>
      <FullscreenContainer.Row sticky>
        <Text textStyle="headline4">
          {typeDraft.name}{' '}
          <Text as="span" textStyle="headline6">
            {typeDraft.kind === 'entity' ? 'Entity type' : 'Value type'}
          </Text>
        </Text>
      </FullscreenContainer.Row>
      <FullscreenContainer.Row gap={2} paddingVertical={3}>
        <SchemaTypeEditor
          typeDraft={typeDraft}
          dispatchSchemaEditorState={dispatchSchemaEditorState}
        />
      </FullscreenContainer.Row>
    </>
  );
}
