import type { EntityReference, ReferenceFieldSpecification } from '@dossierhq/core';
import { XIcon } from 'lucide-react';
import { useCallback, useContext, useReducer, useState } from 'react';
import { ContentEditorDispatchContext } from '../contexts/ContentEditorDispatchContext.js';
import { useEntity } from '../hooks/useEntity.js';
import { ContentEditorActions } from '../reducers/ContentEditorReducer.js';
import {
  initializeContentListState,
  reduceContentListState,
} from '../reducers/ContentListReducer.js';
import { EntityCard } from './EntityCard.js';
import type { FieldEditorProps } from './FieldEditor.js';
import { OpenContentDialogContent } from './OpenContentDialogContent.js';
import { Button } from './ui/button.js';
import { Dialog } from './ui/dialog.js';
import { ValidationIssuesDisplay } from './ValidationIssuesDisplay.js';

type Props = FieldEditorProps<ReferenceFieldSpecification, EntityReference>;

export function ReferenceFieldEditor({
  id,
  fieldSpec,
  value,
  validationIssues,
  dragHandle,
  onChange,
}: Props) {
  const dispatchContentEditor = useContext(ContentEditorDispatchContext);
  const { entity } = useEntity(value ?? undefined);

  const handleEntityClick = useCallback(() => {
    if (!value) return;
    // open entity asynchronously to not fight with the "click to activate entity" functionality
    setTimeout(() => dispatchContentEditor(new ContentEditorActions.AddDraft({ id: value.id })));
  }, [dispatchContentEditor, value]);
  const handleClear = useCallback(() => onChange(null), [onChange]);

  return (
    <>
      {value ? (
        <div className="group flex items-center gap-2">
          {dragHandle}
          {entity ? (
            <EntityCard
              id={id}
              className="grow"
              name={entity.info.name}
              status={entity.info.status}
              type={entity.info.type}
              valid={entity.info.valid && entity.info.validPublished !== false}
              onClick={handleEntityClick}
            />
          ) : (
            <div className="grow" />
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Remove"
            className="size-6 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
            onClick={handleClear}
          >
            <XIcon />
          </Button>
        </div>
      ) : (
        <SelectEntityButton id={id} fieldSpec={fieldSpec} onEntitySelected={onChange} />
      )}
      <ValidationIssuesDisplay validationIssues={validationIssues} />
    </>
  );
}

function SelectEntityButton({
  id,
  fieldSpec,
  onEntitySelected,
}: {
  id?: string;
  fieldSpec: ReferenceFieldSpecification;
  onEntitySelected: (reference: EntityReference) => void;
}) {
  const [showSelector, setShowSelector] = useState(false);

  return (
    <>
      <Button id={id} className="self-start" onClick={() => setShowSelector(true)}>
        Select entity
      </Button>
      {showSelector ? (
        <Dialog open onOpenChange={setShowSelector}>
          <SelectEntityDialogContent
            entityTypes={fieldSpec.entityTypes}
            onEntitySelected={(reference) => {
              onEntitySelected(reference);
              setShowSelector(false);
            }}
          />
        </Dialog>
      ) : null}
    </>
  );
}

function SelectEntityDialogContent({
  entityTypes,
  onEntitySelected,
}: {
  entityTypes: string[];
  onEntitySelected: (reference: EntityReference) => void;
}) {
  const [contentListState, dispatchContentList] = useReducer(
    reduceContentListState,
    { mode: 'full' as const, restrictEntityTypes: entityTypes },
    initializeContentListState,
  );

  return (
    <OpenContentDialogContent
      title="Select entity"
      contentListState={contentListState}
      dispatchContentList={dispatchContentList}
      onOpenEntity={(entityId) => onEntitySelected({ id: entityId })}
    />
  );
}

export function AddEntityListItemButton({
  fieldSpec,
  onAddItem,
}: {
  fieldSpec: ReferenceFieldSpecification;
  onAddItem: (value: EntityReference | null) => void;
}) {
  return <SelectEntityButton fieldSpec={fieldSpec} onEntitySelected={onAddItem} />;
}
