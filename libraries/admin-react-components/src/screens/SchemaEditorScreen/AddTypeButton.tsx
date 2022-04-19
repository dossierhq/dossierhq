import { Button } from '@jonasb/datadata-design';
import type { Dispatch, ReactNode } from 'react';
import React, { useCallback } from 'react';
import type { SchemaEditorStateAction } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';
import { SchemaEditorActions } from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';

export function AddTypeButton({
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
