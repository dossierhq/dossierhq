import { useContext, useEffect, type Dispatch } from 'react';
import { EntityEditorDispatchContext } from '../contexts/EntityEditorDispatchContext.js';
import { EntityEditorStateContext } from '../contexts/EntityEditorStateContext.js';
import { useEntity } from '../hooks/useEntity.js';
import { useSchema } from '../hooks/useSchema.js';
import { EntityEditorActions, type EntityEditorStateAction } from '../reducers/EntityEditorReducer';

export function ContentEditorLoader() {
  const entityEditorState = useContext(EntityEditorStateContext);
  const dispatchEntityEditorState = useContext(EntityEditorDispatchContext);
  const { schema } = useSchema();

  useEffect(() => {
    if (schema) {
      dispatchEntityEditorState(new EntityEditorActions.UpdateSchemaSpecification(schema));
    }
  }, [dispatchEntityEditorState, schema]);

  return (
    <>
      {entityEditorState.drafts.map((draftState) => {
        if (draftState.isNew) {
          return null;
        }
        return (
          <EntityLoader
            key={draftState.id}
            id={draftState.id}
            dispatchEntityEditorState={dispatchEntityEditorState}
          />
        );
      })}
    </>
  );
}

function EntityLoader({
  id,
  dispatchEntityEditorState,
}: {
  id: string;
  dispatchEntityEditorState: Dispatch<EntityEditorStateAction>;
}) {
  //TODO don't fetch new entities
  //TODO handle errors
  const { entity, entityError: _unused } = useEntity({ id });

  useEffect(() => {
    if (entity) {
      dispatchEntityEditorState(new EntityEditorActions.UpdateEntity(entity));
    }
  }, [dispatchEntityEditorState, entity]);

  return null;
}
