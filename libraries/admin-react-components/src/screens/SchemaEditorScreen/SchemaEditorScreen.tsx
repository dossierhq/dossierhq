import { FullscreenContainer, Text } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React, { useContext, useEffect, useReducer } from 'react';
import { DataDataContext2 } from '../..';
import { SchemaTypeEditor } from '../../components/SchemaTypeEditor/SchemaTypeEditor';
import type {
  SchemaEditorStateAction,
  SchemaTypeDraft,
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
        {schemaEditorState.entityTypes.map((entityType) => (
          <TypeEditor
            key={entityType.name}
            type={entityType}
            dispatchSchemaEditorState={dispatchSchemaEditorState}
          />
        ))}
        {schemaEditorState.valueTypes.map((valueType) => (
          <TypeEditor
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

function TypeEditor({
  type,
  dispatchSchemaEditorState,
}: {
  type: SchemaTypeDraft;
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
