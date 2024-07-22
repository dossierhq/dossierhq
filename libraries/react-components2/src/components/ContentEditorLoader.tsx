import { useContext, useEffect, type Dispatch } from 'react';
import { ContentEditorDispatchContext } from '../contexts/ContentEditorDispatchContext.js';
import { ContentEditorStateContext } from '../contexts/ContentEditorStateContext.js';
import { useEntity } from '../hooks/useEntity.js';
import { useSchema } from '../hooks/useSchema.js';
import {
  ContentEditorActions,
  type ContentEditorStateAction,
} from '../reducers/ContentEditorReducer.js';

export function ContentEditorLoader() {
  const contentEditorState = useContext(ContentEditorStateContext);
  const dispatchContentEditor = useContext(ContentEditorDispatchContext);
  const { schema } = useSchema();

  useEffect(() => {
    if (schema) {
      dispatchContentEditor(new ContentEditorActions.UpdateSchemaSpecification(schema));
    }
  }, [dispatchContentEditor, schema]);

  return (
    <>
      {contentEditorState.drafts.map((draftState) => {
        if (draftState.isNew) {
          return null;
        }
        return (
          <EntityLoader
            key={draftState.id}
            id={draftState.id}
            dispatchContentEditor={dispatchContentEditor}
          />
        );
      })}
    </>
  );
}

function EntityLoader({
  id,
  dispatchContentEditor,
}: {
  id: string;
  dispatchContentEditor: Dispatch<ContentEditorStateAction>;
}) {
  //TODO handle errors
  const { entity, entityError: _unused } = useEntity({ id });

  useEffect(() => {
    if (entity) {
      dispatchContentEditor(new ContentEditorActions.UpdateEntity(entity));
    }
  }, [dispatchContentEditor, entity]);

  return null;
}
