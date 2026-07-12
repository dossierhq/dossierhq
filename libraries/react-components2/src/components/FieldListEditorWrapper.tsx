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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  groupValidationIssuesByTopLevelPath,
  type FieldSpecification,
  type PublishValidationIssue,
  type SaveValidationIssue,
} from '@dossierhq/core';
import { GripVerticalIcon } from 'lucide-react';
import { useCallback, useMemo, type JSX, type JSXElementConstructor } from 'react';
import type { FieldEditorProps } from './FieldEditor.js';
import { ValidationIssuesDisplay } from './ValidationIssuesDisplay.js';

interface Props<TFieldSpec extends FieldSpecification, TItem> extends FieldEditorProps<
  TFieldSpec,
  (TItem | null)[]
> {
  AddButton: JSXElementConstructor<{
    fieldSpec: TFieldSpec;
    onAddItem: (value: TItem | null) => void;
  }>;
  Editor: JSXElementConstructor<FieldEditorProps<TFieldSpec, TItem>>;
}

const noErrors: (PublishValidationIssue | SaveValidationIssue)[] = [];

export function FieldListEditorWrapper<TFieldSpec extends FieldSpecification, TItem>({
  id,
  value,
  fieldSpec,
  adminOnly,
  validationIssues,
  onChange,
  AddButton,
  Editor,
}: Props<TFieldSpec, TItem>): JSX.Element {
  const handleAddItem = useCallback(
    (itemValue: TItem | null) => {
      if (onChange) {
        onChange(value ? [...value, itemValue] : [itemValue]);
      }
    },
    [value, onChange],
  );
  const handleItemChange = useCallback(
    (itemValue: TItem | null, index: number) => {
      if (onChange) {
        const newValue = value ? [...value] : [];
        if (itemValue === null || itemValue === undefined) {
          newValue.splice(index, 1);
        } else {
          newValue[index] = itemValue;
        }
        onChange(newValue.length > 0 ? newValue : null);
      }
    },
    [value, onChange],
  );

  const { root: rootValidationIssues, children: indexValidationIssues } = useMemo(
    () => groupValidationIssuesByTopLevelPath(validationIssues),
    [validationIssues],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // dnd-kit needs stable non-zero ids, so use index + 1
  const sortableIds = useMemo(() => (value ? value.map((_, index) => index + 1) : []), [value]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!value || !over || active.id === over.id) {
        return;
      }
      const fromIndex = (active.id as number) - 1;
      const toIndex = (over.id as number) - 1;
      onChange(arrayMove(value, fromIndex, toIndex));
    },
    [value, onChange],
  );

  return (
    <div className="flex flex-col gap-1 overflow-y-auto">
      {value && value.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {value.map((it, index) => (
              <SortableFieldListItem key={index} sortableId={index + 1}>
                {(dragHandle) => (
                  <Editor
                    id={index === 0 ? id : undefined}
                    value={it}
                    fieldSpec={fieldSpec}
                    adminOnly={adminOnly}
                    validationIssues={indexValidationIssues.get(index) ?? noErrors}
                    dragHandle={dragHandle}
                    onChange={(newItemValue) => handleItemChange(newItemValue, index)}
                  />
                )}
              </SortableFieldListItem>
            ))}
          </SortableContext>
        </DndContext>
      ) : null}
      <AddButton fieldSpec={fieldSpec} onAddItem={handleAddItem} />
      <ValidationIssuesDisplay validationIssues={rootValidationIssues} />
    </div>
  );
}

function SortableFieldListItem({
  sortableId,
  children,
}: {
  sortableId: number;
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
