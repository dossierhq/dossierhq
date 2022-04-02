import { AdminSchema } from '@jonasb/datadata-core';
import {
  Button,
  EmptyStateMessage,
  FullscreenContainer,
  NotificationContext,
  Text,
} from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React, { useCallback, useContext, useEffect, useReducer } from 'react';
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
          <AddEntityTypeButton dispatchSchemaEditorState={dispatchSchemaEditorState} />
          <SaveSchemaButton
            schemaEditorState={schemaEditorState}
            dispatchSchemaEditorState={dispatchSchemaEditorState}
          />
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
                type={entityType}
                dispatchSchemaEditorState={dispatchSchemaEditorState}
              />
            ))}
            {schemaEditorState.valueTypes.map((valueType) => (
              <TypeEditorRows
                key={valueType.name}
                type={valueType}
                dispatchSchemaEditorState={dispatchSchemaEditorState}
              />
            ))}
          </>
        )}
      </FullscreenContainer.ScrollableRow>
      {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
    </FullscreenContainer>
  );
}

function SaveSchemaButton({
  schemaEditorState,
  dispatchSchemaEditorState,
}: {
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}) {
  const { adminClient } = useContext(DataDataContext2);
  const { showNotification } = useContext(NotificationContext);
  const { cache, mutate } = useSWRConfig();
  const handleClick = useCallback(async () => {
    const schemaSpecUpdate = getSchemaSpecificationUpdateFromEditorState(schemaEditorState);
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
  }, [adminClient, cache, dispatchSchemaEditorState, mutate, schemaEditorState, showNotification]);
  return (
    <Button onClick={handleClick} disabled={schemaEditorState.status !== 'changed'}>
      Save schema
    </Button>
  );
}

function AddEntityTypeButton({
  dispatchSchemaEditorState,
}: {
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}) {
  const handleClick = useCallback(() => {
    const name = window.prompt('Entity type name?');
    if (name) {
      dispatchSchemaEditorState(new SchemaEditorActions.AddEntityType(name));
    }
  }, [dispatchSchemaEditorState]);
  return <Button onClick={handleClick}>Add entity type</Button>;
}

function TypeEditorRows({
  type,
  dispatchSchemaEditorState,
}: {
  type: SchemaEntityTypeDraft | SchemaValueTypeDraft;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}) {
  return (
    <>
      <FullscreenContainer.Row sticky>
        <Text textStyle="headline4">{type.name}</Text>
      </FullscreenContainer.Row>
      <FullscreenContainer.Row gap={2} paddingVertical={3}>
        <SchemaTypeEditor type={type} dispatchSchemaEditorState={dispatchSchemaEditorState} />
      </FullscreenContainer.Row>
    </>
  );
}
