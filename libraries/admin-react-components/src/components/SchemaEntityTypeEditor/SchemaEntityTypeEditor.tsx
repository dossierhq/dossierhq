import { Text } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React from 'react';
import type {
  EntityTypeDraft,
  SchemaEditorStateAction,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';

interface Props {
  entityType: EntityTypeDraft;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
}

export function SchemaEntityTypeEditor({ entityType, dispatchSchemaEditorState: _unused }: Props) {
  return <Text textStyle="headline4">{entityType.name}</Text>;
}
