import { useContext } from 'react';
import { EntityFieldEditor } from '../components/EntityFieldEditor.js';
import { EntityEditorDispatchContext } from '../contexts/EntityEditorDispatchContext.js';
import {
  EntityEditorActions,
  type EntityEditorDraftState,
} from '../reducers/EntityEditorReducer.js';
import { EntityCard } from './EntityCard.js';

interface Props {
  draftState: EntityEditorDraftState;
}

export function EntityEditor({ draftState }: Props) {
  // const { client } = useContext(DossierContext);
  const dispatchEntityEditorState = useContext(EntityEditorDispatchContext);
  // const [submitLoading, setSubmitLoading] = useState(false);

  /* TODO
  const handleNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      dispatchEntityEditorState(new EntityEditorActions.SetName(draftState.id, event.target.value)),
    [dispatchEntityEditorState, draftState.id],
  );
  const handleAuthKeyChange = useCallback(
    (authKey: string) =>
      dispatchEntityEditorState(new EntityEditorActions.SetAuthKey(draftState.id, authKey)),
    [dispatchEntityEditorState, draftState.id],
  );
  const handleSubmitClick = useCallback(() => {
    submitEntity(
      draftState,
      setSubmitLoading,
      client,
      dispatchEntityEditorState,
      showNotification,
      false,
    );
  }, [client, dispatchEntityEditorState, draftState, showNotification]);
  const handleSubmitAndPublishClick = useCallback(() => {
    submitEntity(
      draftState,
      setSubmitLoading,
      client,
      dispatchEntityEditorState,
      showNotification,
      true,
    );
  }, [client, dispatchEntityEditorState, draftState, showNotification]);
  */

  if (!draftState.draft) {
    return null;
  }

  // const isNewEntity = !draftState.entity;
  // const isSubmittable =
  //   !submitLoading && (isNewEntity || draftState.status === 'changed') && !draftState.hasSaveErrors;
  // const isPublishable = !draftState.hasPublishErrors;

  return (
    <>
      {draftState.entity ? <EntityCard info={draftState.entity.info} /> : null}
      {/* <Field>
        <Field.Label>Name</Field.Label>
        <Field.Control>
          <Input value={draftState.draft.name} onChange={handleNameChange} />
          {draftState.draft.nameIsLinkedToField ? (
            <Text textStyle="body2" marginTop={1}>
              The name is linked to the field: {draftState.draft.entitySpec.nameField}.
            </Text>
          ) : null}
        </Field.Control>
      </Field> */}
      {/* {!draftState.entity && draftState.draft.entitySpec.authKeyPattern ? (
        <Field>
          <Field.Label>Authorization key</Field.Label>
          <Field.Control>
            <AuthKeyPicker
              patternName={draftState.draft.entitySpec.authKeyPattern}
              value={draftState.draft.authKey}
              onValueChange={handleAuthKeyChange}
            />
          </Field.Control>
          {draftState.draft.authKey === null ? (
            <Field.Help color="danger">Authorization key is required</Field.Help>
          ) : null}
        </Field>
      ) : null} */}
      {/* <Row gap={2} justifyContent="center">
        <Button color="primary" disabled={!isSubmittable} onClick={handleSubmitClick}>
          {isNewEntity ? 'Create' : 'Save'}
        </Button>
        {draftState.draft.entitySpec.publishable ? (
          <Button disabled={!isSubmittable || !isPublishable} onClick={handleSubmitAndPublishClick}>
            {isNewEntity ? 'Create & publish' : 'Save & publish'}
          </Button>
        ) : null}
        <PublishingButton
          disabled={draftState.status !== ''}
          entity={draftState.entity}
          entitySpec={draftState.draft.entitySpec}
        />
      </Row> */}
      {draftState.draft.fields.map((field) => (
        <EntityFieldEditor
          key={field.fieldSpec.name}
          field={field}
          onValueChange={(value) =>
            dispatchEntityEditorState(
              new EntityEditorActions.SetField(draftState.id, field.fieldSpec.name, value),
            )
          }
        />
      ))}
    </>
  );
}

/*
async function submitEntity(
  draftState: EntityEditorDraftState,
  setSubmitLoading: Dispatch<SetStateAction<boolean>>,
  client: DossierClient<Entity<string, object>, Component<string, object>>,
  dispatchEntityEditorState: Dispatch<EntityEditorStateAction>,
  showNotification: (notification: NotificationInfo) => void,
  publish: boolean,
) {
  setSubmitLoading(true);
  dispatchEntityEditorState(
    new EntityEditorActions.SetNextEntityUpdateIsDueToUpsert(draftState.id, true),
  );

  const isCreate = !draftState.entity;
  let result;
  if (isCreate) {
    const entityCreate = getEntityCreateFromDraftState(draftState);
    result = await client.createEntity(entityCreate, { publish });
  } else {
    const entityUpdate = getEntityUpdateFromDraftState(draftState);
    result = await client.updateEntity(entityUpdate, { publish });
  }
  if (result.isOk()) {
    const message = isCreate
      ? publish
        ? 'Created and published entity'
        : 'Created entity'
      : publish
        ? 'Updated and published entity'
        : 'Updated entity';
    showNotification({ color: 'success', message });
  } else {
    const message = isCreate
      ? publish
        ? 'Failed creating and publishing entity'
        : 'Failed creating entity'
      : publish
        ? 'Failed updating and publishing entity'
        : 'Failed updating entity';
    showNotification({ color: 'error', message });
    dispatchEntityEditorState(
      new EntityEditorActions.SetNextEntityUpdateIsDueToUpsert(draftState.id, false),
    );
  }

  setSubmitLoading(false);
}
*/