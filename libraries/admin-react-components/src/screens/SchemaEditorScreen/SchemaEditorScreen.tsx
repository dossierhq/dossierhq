import { Button, FullscreenContainer, Text } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React, { useCallback, useContext, useEffect, useReducer } from 'react';
import { DataDataContext2 } from '../..';
import { SchemaTypeEditor } from '../../components/SchemaTypeEditor/SchemaTypeEditor';
import type {
  SchemaEditorStateAction,
  SchemaEntityTypeDraft,
  SchemaValueTypeDraft,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';
import {
  initializeSchemaEditorState,
  reduceSchemaEditorState,
  SchemaEditorActions,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';

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

  return (
    <FullscreenContainer>
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.ScrollableRow>
        <FullscreenContainer.Row flexDirection="row" paddingVertical={5}>
          <AddEntityTypeButton dispatchSchemaEditorState={dispatchSchemaEditorState} />
        </FullscreenContainer.Row>
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
      </FullscreenContainer.ScrollableRow>
      {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
    </FullscreenContainer>
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
