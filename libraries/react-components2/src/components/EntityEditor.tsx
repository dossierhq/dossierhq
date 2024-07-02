import type { Component, DossierClient, Entity } from '@dossierhq/core';
import { ChevronDownIcon, ChevronUpIcon, MenuIcon } from 'lucide-react';
import { useCallback, useContext, useState, type Dispatch, type SetStateAction } from 'react';
import { EntityFieldEditor } from '../components/EntityFieldEditor.js';
import { ContentEditorDispatchContext } from '../contexts/ContentEditorDispatchContext.js';
import { DossierContext } from '../contexts/DossierContext.js';
import { CommandMenuState_OpenPageAction } from '../reducers/CommandReducer.js';
import {
  ContentEditorActions,
  getEntityCreateFromDraftState,
  getEntityUpdateFromDraftState,
  type ContentEditorDraftState,
  type ContentEditorStateAction,
} from '../reducers/ContentEditorReducer.js';
import type {
  ContentEditorCommandMenuAction,
  ContentEditorCommandMenuConfig,
} from './ContentEditorCommandMenu.js';
import { EntityCard } from './EntityCard.js';
import { Button } from './ui/button.js';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible.js';

interface Props {
  id?: string;
  draftState: ContentEditorDraftState;
  dispatchCommandMenu: Dispatch<ContentEditorCommandMenuAction>;
}

export function EntityEditor({ id, draftState, dispatchCommandMenu }: Props) {
  const dispatchContentEditor = useContext(ContentEditorDispatchContext);
  const [showFields, setShowFields] = useState(true);

  /* TODO
  const handleNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      dispatchContentEditor(new ContentEditorActions.SetName(draftState.id, event.target.value)),
    [dispatchContentEditor, draftState.id],
  );
  const handleAuthKeyChange = useCallback(
    (authKey: string) =>
      dispatchContentEditor(new ContentEditorActions.SetAuthKey(draftState.id, authKey)),
    [dispatchContentEditor, draftState.id],
  );
  const handleSubmitAndPublishClick = useCallback(() => {
    submitEntity(
      draftState,
      setSubmitLoading,
      client,
      dispatchContentEditor,
      showNotification,
      true,
    );
  }, [client, dispatchContentEditor, draftState, showNotification]);
  */

  if (!draftState.draft) {
    return null;
  }

  // the id we scroll to can't be sticky, so we need to add a placeholder
  return (
    <>
      {id ? <span id={id} /> : null}
      <div className="sticky top-0 bg-background pt-1">
        <EntityCard
          authKey={draftState.draft.authKey}
          changed={draftState.status === 'changed'}
          name={draftState.draft.name}
          status={draftState.entity?.info.status}
          type={draftState.draft.entitySpec.name}
          updatedAt={draftState.entity?.info.updatedAt}
          valid={draftState.entity?.info.valid}
        />
      </div>
      <Collapsible open={showFields} onOpenChange={setShowFields}>
        <EntityEditorToolbar
          draftState={draftState}
          showFields={showFields}
          dispatchCommandMenu={dispatchCommandMenu}
          dispatchEntityEditor={dispatchContentEditor}
        />
        <CollapsibleContent className="CollapsibleContent">
          <div className="mb-6 w-full rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
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
                  dispatchContentEditor(
                    new ContentEditorActions.SetField(draftState.id, field.fieldSpec.name, value),
                  )
                }
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}

function EntityEditorToolbar({
  draftState,
  showFields,
  dispatchCommandMenu,
  dispatchEntityEditor,
}: {
  draftState: ContentEditorDraftState;
  showFields: boolean;
  dispatchCommandMenu: Dispatch<ContentEditorCommandMenuAction>;
  dispatchEntityEditor: Dispatch<ContentEditorStateAction>;
}) {
  const { client } = useContext(DossierContext);
  //TODO useTransition() instead when react 19
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleMenuClick = useCallback(() => {
    dispatchCommandMenu(
      new CommandMenuState_OpenPageAction<ContentEditorCommandMenuConfig>({
        id: 'draft',
        draftId: draftState.id,
      }),
    );
  }, [dispatchCommandMenu, draftState.id]);

  const handleSubmitClick = useCallback(() => {
    submitEntity(draftState, setSubmitLoading, client, dispatchEntityEditor, false);
  }, [client, dispatchEntityEditor, draftState]);

  const isSubmittable =
    !submitLoading &&
    (draftState.isNew || draftState.status === 'changed') &&
    !draftState.hasSaveErrors;
  //TODO const isPublishable = !draftState.hasPublishErrors;

  return (
    <div className="mb-2 flex gap-2">
      <div className="flex w-0 flex-grow gap-2 overflow-auto">
        <Button variant="ghost" onClick={handleMenuClick}>
          <MenuIcon className="h-4 w-4" />
        </Button>
        <Button color="primary" disabled={!isSubmittable} onClick={handleSubmitClick}>
          {draftState.isNew ? 'Create' : 'Save'}
        </Button>
      </div>
      <CollapsibleTrigger asChild>
        <Button variant="ghost">
          {showFields ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
    </div>
  );
}

async function submitEntity(
  draftState: ContentEditorDraftState,
  setSubmitLoading: Dispatch<SetStateAction<boolean>>,
  client: DossierClient<Entity<string, object>, Component<string, object>>,
  dispatchContentEditor: Dispatch<ContentEditorStateAction>,
  publish: boolean,
) {
  setSubmitLoading(true);
  dispatchContentEditor(
    new ContentEditorActions.SetNextEntityUpdateIsDueToUpsert(draftState.id, true),
  );

  let result;
  if (draftState.isNew) {
    const entityCreate = getEntityCreateFromDraftState(draftState);
    result = await client.createEntity(entityCreate, { publish });
  } else {
    const entityUpdate = getEntityUpdateFromDraftState(draftState);
    result = await client.updateEntity(entityUpdate, { publish });
  }
  if (result.isOk()) {
    // const message = isCreate
    //   ? publish
    //     ? 'Created and published entity'
    //     : 'Created entity'
    //   : publish
    //     ? 'Updated and published entity'
    //     : 'Updated entity';
    //TODO showNotification({ color: 'success', message });
    if (draftState.isNew) {
      dispatchContentEditor(new ContentEditorActions.SetEntityIsNoLongerNew(draftState.id));
    }
  } else {
    // const message = isCreate
    //   ? publish
    //     ? 'Failed creating and publishing entity'
    //     : 'Failed creating entity'
    //   : publish
    //     ? 'Failed updating and publishing entity'
    //     : 'Failed updating entity';
    //TODO showNotification({ color: 'error', message });
    dispatchContentEditor(
      new ContentEditorActions.SetNextEntityUpdateIsDueToUpsert(draftState.id, false),
    );
  }
  setSubmitLoading(false);
}
