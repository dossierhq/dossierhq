import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FieldType } from '@dossierhq/core';
import { GripVerticalIcon } from 'lucide-react';
import { useId, type Dispatch, type JSX } from 'react';
import {
  SchemaEditorActions,
  type SchemaComponentTypeDraft,
  type SchemaEditorState,
  type SchemaEditorStateAction,
  type SchemaEntityTypeDraft,
  type SchemaFieldSelector,
  type SchemaTypeSelector,
} from '../reducers/SchemaEditorReducer.js';
import { NameSelector, PatternSelector } from './SchemaEditorSelectors.js';
import { SchemaFieldEditor } from './SchemaFieldEditor.js';
import { Button } from './ui/button.js';
import { Checkbox } from './ui/checkbox.js';
import { Label } from './ui/label.js';

interface Props {
  typeSelector: SchemaTypeSelector;
  typeDraft: SchemaEntityTypeDraft | SchemaComponentTypeDraft;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onAddOrRenameField: (selector: SchemaFieldSelector | SchemaTypeSelector) => void;
}

export function SchemaTypeEditor({
  typeSelector,
  typeDraft,
  schemaEditorState,
  dispatchSchemaEditorState,
  onAddOrRenameField,
}: Props) {
  const baseId = useId();

  const potentialNameFields =
    typeDraft.kind === 'entity'
      ? typeDraft.fields
          .filter((it) => it.type === FieldType.String && !it.list)
          .map((it) => it.name)
      : [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fieldNames = typeDraft.fields.map((it) => it.name);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const fieldToMove = String(active.id);
    const targetField = String(over.id);
    const fromIndex = fieldNames.indexOf(fieldToMove);
    const toIndex = fieldNames.indexOf(targetField);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }
    dispatchSchemaEditorState(
      new SchemaEditorActions.ReorderFields(
        typeSelector,
        fieldToMove,
        fromIndex < toIndex ? 'after' : 'before',
        targetField,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox
          id={`${baseId}-typeToggle`}
          checked={typeDraft.kind === 'entity' ? typeDraft.publishable : typeDraft.adminOnly}
          onCheckedChange={(checked) =>
            dispatchSchemaEditorState(
              new SchemaEditorActions.ChangeTypeAdminOnly(typeSelector, checked === true),
            )
          }
        />
        <Label htmlFor={`${baseId}-typeToggle`}>
          {typeDraft.kind === 'entity' ? 'Publishable' : 'Admin only'}
        </Label>
      </div>
      {typeDraft.kind === 'entity' && potentialNameFields.length > 0 ? (
        <div className="flex flex-col gap-1">
          <Label>Name field</Label>
          <NameSelector
            value={typeDraft.nameField}
            names={potentialNameFields}
            onChange={(value) =>
              dispatchSchemaEditorState(
                new SchemaEditorActions.ChangeTypeNameField(typeSelector, value),
              )
            }
          />
        </div>
      ) : null}
      {'authKeyPattern' in typeDraft ? (
        <div className="flex flex-col gap-1">
          <Label>Auth key pattern</Label>
          <PatternSelector
            value={typeDraft.authKeyPattern}
            schemaEditorState={schemaEditorState}
            onChange={(value) =>
              dispatchSchemaEditorState(
                new SchemaEditorActions.ChangeTypeAuthKeyPattern(typeSelector, value),
              )
            }
          />
        </div>
      ) : null}
      <div>
        <Button variant="secondary" onClick={() => onAddOrRenameField(typeSelector)}>
          Add field
        </Button>
      </div>
      {typeDraft.fields.length > 0 ? (
        <div className="flex flex-col gap-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={fieldNames} strategy={verticalListSortingStrategy}>
              {typeDraft.fields.map((fieldDraft) => (
                <SortableFieldItem key={fieldDraft.name} sortableId={fieldDraft.name}>
                  {(dragHandle) => (
                    <SchemaFieldEditor
                      fieldSelector={{ ...typeSelector, fieldName: fieldDraft.name }}
                      fieldDraft={fieldDraft}
                      schemaEditorState={schemaEditorState}
                      dispatchSchemaEditorState={dispatchSchemaEditorState}
                      dragHandle={dragHandle}
                      onAddOrRenameField={onAddOrRenameField}
                    />
                  )}
                </SortableFieldItem>
              ))}
            </SortableContext>
          </DndContext>
        </div>
      ) : null}
    </div>
  );
}

function SortableFieldItem({
  sortableId,
  children,
}: {
  sortableId: string;
  children: (dragHandle: JSX.Element) => JSX.Element;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sortableId,
  });

  const dragHandle = (
    <button
      type="button"
      aria-label="Reorder"
      className="text-muted-foreground cursor-grab self-center active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <GripVerticalIcon className="size-4" />
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      className={isDragging ? 'relative z-10' : undefined}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {children(dragHandle)}
    </div>
  );
}
