import {
  EntityStatus,
  type Component,
  type DossierClient,
  type Entity,
  type EntityTypeSpecification,
  type ErrorType,
  type Result,
} from '@dossierhq/core';
import { ChevronDownIcon } from 'lucide-react';
import { useContext, useMemo, useState, type Dispatch } from 'react';
import { toast } from 'sonner';
import { ContentEditorDispatchContext } from '../contexts/ContentEditorDispatchContext.js';
import { DossierContext } from '../contexts/DossierContext.js';
import {
  ContentEditorActions,
  type ContentEditorStateAction,
} from '../reducers/ContentEditorReducer.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog.js';
import { Button } from './ui/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu.js';

interface Props {
  disabled?: boolean;
  entity: Entity | null;
  entitySpec: EntityTypeSpecification;
}

type PublishingActionId = 'publish' | 'unpublish' | 'archive' | 'unarchive' | 'delete';

interface PublishAction {
  id: PublishingActionId;
  name: string;
}

const successMessages: Record<PublishingActionId, string> = {
  archive: 'Archived entity',
  publish: 'Published entity',
  unarchive: 'Unarchived entity',
  unpublish: 'Unpublished entity',
  delete: 'Deleted entity',
};

const errorMessages: Record<PublishingActionId, string> = {
  archive: 'Failed archiving entity',
  publish: 'Failed publishing entity',
  unarchive: 'Failed unarchiving entity',
  unpublish: 'Failed unpublishing entity',
  delete: 'Failed deleting entity',
};

export function PublishingButton({ disabled, entity, entitySpec }: Props) {
  const { client } = useContext(DossierContext);
  const dispatchContentEditor = useContext(ContentEditorDispatchContext);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [buttonAction, ...dropdownActions] = useMemo(
    () => createPublishActions(entity, entitySpec),
    [entity, entitySpec],
  );

  if (!buttonAction || !entity) {
    return null;
  }

  const handleAction = (actionId: PublishingActionId) => {
    if (actionId === 'delete') {
      setConfirmDelete(true);
      return;
    }
    void executeAction(actionId, entity, client, dispatchContentEditor);
  };

  return (
    <div className="flex justify-center gap-2">
      <Button variant="outline" disabled={disabled} onClick={() => handleAction(buttonAction.id)}>
        {buttonAction.name}
      </Button>
      {dropdownActions.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" disabled={disabled} aria-label="More actions">
              <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {dropdownActions.map((action) => (
              <DropdownMenuItem key={action.id} onSelect={() => handleAction(action.id)}>
                {action.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete entity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the entity. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void executeAction('delete', entity, client, dispatchContentEditor)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function createPublishActions(
  entity: Entity | null,
  entitySpec: EntityTypeSpecification,
): PublishAction[] {
  if (!entity) {
    return [];
  }

  const { status } = entity.info;

  let publishActionsIds: PublishingActionId[] = [];
  if (status === EntityStatus.draft || status === EntityStatus.withdrawn) {
    publishActionsIds = ['publish', 'archive'];
  } else if (status === EntityStatus.published) {
    publishActionsIds = ['unpublish'];
  } else if (status === EntityStatus.modified) {
    publishActionsIds = ['publish', 'unpublish'];
  } else if (status === EntityStatus.archived) {
    publishActionsIds = ['unarchive', 'publish', 'delete'];
  }

  if (!entitySpec.publishable) {
    publishActionsIds = publishActionsIds.filter((it) => it !== 'publish');
  }

  const names: Record<PublishingActionId, string> = {
    archive: 'Archive',
    unarchive: 'Unarchive',
    publish: 'Publish',
    unpublish: 'Unpublish',
    delete: 'Delete',
  };
  return publishActionsIds.map((id) => ({ id, name: names[id] }));
}

async function executeAction(
  action: PublishingActionId,
  entity: Entity,
  client: DossierClient<Entity<string, object>, Component<string, object>>,
  dispatchContentEditor: Dispatch<ContentEditorStateAction>,
) {
  const reference = { id: entity.id };
  let result: Result<unknown, ErrorType>;
  switch (action) {
    case 'archive':
      result = await client.archiveEntity(reference);
      break;
    case 'publish':
      result = await client.publishEntities([{ ...reference, version: entity.info.version }]);
      break;
    case 'unarchive':
      result = await client.unarchiveEntity(reference);
      break;
    case 'unpublish':
      result = await client.unpublishEntities([reference]);
      break;
    case 'delete':
      result = await client.deleteEntities([reference]);
      if (result.isOk()) {
        dispatchContentEditor(new ContentEditorActions.DeleteDraft(reference.id));
      }
      break;
  }

  if (result.isOk()) {
    toast(successMessages[action]);
  } else {
    toast(errorMessages[action]);
  }
}
