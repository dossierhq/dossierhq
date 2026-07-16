'use client';

import { EllipsisVerticalIcon, PlusIcon } from 'lucide-react';
import { useCallback, useEffect, useReducer, useState, type Dispatch } from 'react';
import { EmptyStateMessage } from '../components/EmptyStateMessage.js';
import {
  AddOrRenameFieldDialog,
  AddOrRenameIndexDialog,
  AddOrRenamePatternDialog,
  AddOrRenameTypeDialog,
  EditPatternDialog,
  SaveSchemaDialog,
} from '../components/SchemaEditorDialogs.js';
import { SchemaIndexEditor } from '../components/SchemaIndexEditor.js';
import { SchemaPatternEditor } from '../components/SchemaPatternEditor.js';
import { SchemaTypeEditor } from '../components/SchemaTypeEditor.js';
import { ScreenChrome, type ScreenChromeProps } from '../components/ScreenChrome.js';
import { ThemeToggle } from '../components/ThemeToggle.js';
import { TypeDraftStatusBadge } from '../components/TypeDraftStatusBadge.js';
import { Button } from '../components/ui/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu.js';
import { Toaster } from '../components/ui/sonner.js';
import { useResponsive } from '../hooks/useResponsive.js';
import { useSchema } from '../hooks/useSchema.js';
import { cn } from '../lib/utils.js';
import {
  getElementIdForSelector,
  initializeSchemaEditorState,
  reduceSchemaEditorState,
  SchemaEditorActions,
  type SchemaComponentTypeDraft,
  type SchemaEditorState,
  type SchemaEditorStateAction,
  type SchemaEntityTypeDraft,
  type SchemaFieldSelector,
  type SchemaIndexDraft,
  type SchemaIndexSelector,
  type SchemaPatternDraft,
  type SchemaPatternSelector,
  type SchemaSelector,
  type SchemaTypeSelector,
} from '../reducers/SchemaEditorReducer.js';

export interface SchemaEditorScreenProps extends ScreenChromeProps {
  onEditorHasChangesChange: (hasChanges: boolean) => void;
}

export function SchemaEditorScreen({
  onEditorHasChangesChange,
  header,
  footer,
}: SchemaEditorScreenProps) {
  const { schema } = useSchema();
  const [schemaEditorState, dispatchSchemaEditorState] = useReducer(
    reduceSchemaEditorState,
    undefined,
    initializeSchemaEditorState,
  );
  const [addOrRenameTypeSelector, setAddOrRenameTypeSelector] = useState<
    SchemaTypeSelector | 'add' | null
  >(null);
  const [addOrRenameFieldSelector, setAddOrRenameFieldSelector] = useState<
    SchemaFieldSelector | SchemaTypeSelector | null
  >(null);
  const [addOrRenameIndexSelector, setAddOrRenameIndexSelector] = useState<
    SchemaIndexSelector | 'add' | null
  >(null);
  const [addOrRenamePatternSelector, setAddOrRenamePatternSelector] = useState<
    SchemaPatternSelector | 'add' | null
  >(null);
  const [editPatternSelector, setEditPatternSelector] = useState<SchemaPatternSelector | null>(
    null,
  );
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const hasChanges = schemaEditorState.status === 'changed';

  const handleCloseAddTypeDialog = useCallback(() => setAddOrRenameTypeSelector(null), []);
  const handleCloseAddOrRenameFieldDialog = useCallback(
    () => setAddOrRenameFieldSelector(null),
    [],
  );
  const handleCloseAddOrRenameIndexDialog = useCallback(
    () => setAddOrRenameIndexSelector(null),
    [],
  );
  const handleCloseAddOrRenamePatternDialog = useCallback(
    () => setAddOrRenamePatternSelector(null),
    [],
  );
  const handleCloseEditPatternDialog = useCallback(() => setEditPatternSelector(null), []);
  const handleCloseSaveSchemaDialog = useCallback(() => setShowSaveDialog(false), []);

  useEffect(() => {
    if (schema) {
      dispatchSchemaEditorState(new SchemaEditorActions.UpdateSchemaSpecification(schema));
    }
  }, [schema]);

  useEffect(() => {
    onEditorHasChangesChange(hasChanges);
  }, [hasChanges, onEditorHasChangesChange]);

  useScrollToActiveSelector(schemaEditorState);

  const isEmpty =
    schemaEditorState.entityTypes.length === 0 &&
    schemaEditorState.componentTypes.length === 0 &&
    schemaEditorState.indexes.length === 0 &&
    schemaEditorState.patterns.length === 0;

  const md = useResponsive('md');

  const addButtons = (
    <>
      <Button variant="secondary" onClick={() => setAddOrRenameTypeSelector('add')}>
        <PlusIcon className="size-4" /> Type
      </Button>
      <Button variant="secondary" onClick={() => setAddOrRenameIndexSelector('add')}>
        <PlusIcon className="size-4" /> Index
      </Button>
      <Button variant="secondary" onClick={() => setAddOrRenamePatternSelector('add')}>
        <PlusIcon className="size-4" /> Pattern
      </Button>
    </>
  );
  const saveButton = (
    <Button disabled={!hasChanges} onClick={() => setShowSaveDialog(true)}>
      Review &amp; save schema
    </Button>
  );

  return (
    <>
      <Toaster />
      <ScreenChrome header={header} footer={footer}>
        {md && (
          <aside className="flex w-1/5 max-w-80 min-w-72 flex-col border-r">
            <div className="mt-2 flex flex-col gap-2 px-2">
              <div className="flex gap-2">{addButtons}</div>
              {saveButton}
            </div>
            <div className="flex grow flex-col gap-2 overflow-auto p-2">
              <SchemaMenu
                schemaEditorState={schemaEditorState}
                dispatchSchemaEditorState={dispatchSchemaEditorState}
                onAddOrRenameType={setAddOrRenameTypeSelector}
                onAddOrRenameIndex={setAddOrRenameIndexSelector}
                onAddOrRenamePattern={setAddOrRenamePatternSelector}
              />
            </div>
            <div className="flex justify-between border-t px-2 py-1">
              <ThemeToggle />
            </div>
          </aside>
        )}
        <main className="flex grow flex-col">
          {!md && (
            <div className="flex items-center border-b">
              <div className="container flex gap-2 p-2">
                {addButtons}
                <div className="flex grow justify-end gap-2">{saveButton}</div>
              </div>
            </div>
          )}
          {isEmpty ? (
            <div className="flex grow flex-col items-center justify-center p-2">
              <EmptyStateMessage
                className="w-full max-w-96"
                icon={<PlusIcon />}
                title="Schema is empty"
                description="There are no types in the schema"
              />
            </div>
          ) : (
            <div className="overflow-auto">
              <div className="container flex flex-col gap-4 p-2">
                {schemaEditorState.entityTypes.map((typeDraft) => (
                  <TypeEditorSection
                    key={`${typeDraft.kind}-${typeDraft.name}`}
                    typeDraft={typeDraft}
                    schemaEditorState={schemaEditorState}
                    dispatchSchemaEditorState={dispatchSchemaEditorState}
                    onAddOrRenameType={setAddOrRenameTypeSelector}
                    onAddOrRenameField={setAddOrRenameFieldSelector}
                  />
                ))}
                {schemaEditorState.componentTypes.map((typeDraft) => (
                  <TypeEditorSection
                    key={`${typeDraft.kind}-${typeDraft.name}`}
                    typeDraft={typeDraft}
                    schemaEditorState={schemaEditorState}
                    dispatchSchemaEditorState={dispatchSchemaEditorState}
                    onAddOrRenameType={setAddOrRenameTypeSelector}
                    onAddOrRenameField={setAddOrRenameFieldSelector}
                  />
                ))}
                {schemaEditorState.indexes.map((indexDraft) => (
                  <IndexEditorSection
                    key={`index-${indexDraft.name}`}
                    indexDraft={indexDraft}
                    dispatchSchemaEditorState={dispatchSchemaEditorState}
                    onAddOrRenameIndex={setAddOrRenameIndexSelector}
                  />
                ))}
                {schemaEditorState.patterns.map((patternDraft) => (
                  <PatternEditorSection
                    key={`pattern-${patternDraft.name}`}
                    patternDraft={patternDraft}
                    dispatchSchemaEditorState={dispatchSchemaEditorState}
                    onAddOrRenamePattern={setAddOrRenamePatternSelector}
                    onEditPattern={setEditPatternSelector}
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      </ScreenChrome>
      <AddOrRenameTypeDialog
        selector={addOrRenameTypeSelector}
        schemaEditorState={schemaEditorState}
        dispatchSchemaEditorState={dispatchSchemaEditorState}
        onClose={handleCloseAddTypeDialog}
      />
      <AddOrRenameFieldDialog
        selector={addOrRenameFieldSelector}
        schemaEditorState={schemaEditorState}
        dispatchSchemaEditorState={dispatchSchemaEditorState}
        onClose={handleCloseAddOrRenameFieldDialog}
      />
      <AddOrRenameIndexDialog
        selector={addOrRenameIndexSelector}
        schemaEditorState={schemaEditorState}
        dispatchSchemaEditorState={dispatchSchemaEditorState}
        onClose={handleCloseAddOrRenameIndexDialog}
      />
      <AddOrRenamePatternDialog
        selector={addOrRenamePatternSelector}
        schemaEditorState={schemaEditorState}
        dispatchSchemaEditorState={dispatchSchemaEditorState}
        onClose={handleCloseAddOrRenamePatternDialog}
      />
      <EditPatternDialog
        selector={editPatternSelector}
        schemaEditorState={schemaEditorState}
        dispatchSchemaEditorState={dispatchSchemaEditorState}
        onClose={handleCloseEditPatternDialog}
      />
      <SaveSchemaDialog
        show={showSaveDialog}
        schemaEditorState={schemaEditorState}
        dispatchSchemaEditorState={dispatchSchemaEditorState}
        onClose={handleCloseSaveSchemaDialog}
      />
    </>
  );
}

function useScrollToActiveSelector(schemaEditorState: SchemaEditorState) {
  const { activeSelector, activeSelectorEditorScrollSignal, activeSelectorMenuScrollSignal } =
    schemaEditorState;

  const editorScrollToId = getElementIdForSelector(activeSelector, 'header');
  const editorIdAndSignal = editorScrollToId
    ? `${editorScrollToId}\n${activeSelectorEditorScrollSignal}`
    : null;
  useEffect(() => {
    if (!editorIdAndSignal) return;
    const [elementId, signal] = editorIdAndSignal.split('\n');
    if (Number(signal) <= 0) return;
    document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [editorIdAndSignal]);

  const menuScrollToId = getElementIdForSelector(activeSelector, 'menuItem');
  const menuIdAndSignal = menuScrollToId
    ? `${menuScrollToId}\n${activeSelectorMenuScrollSignal}`
    : null;
  useEffect(() => {
    if (!menuIdAndSignal) return;
    const [elementId, signal] = menuIdAndSignal.split('\n');
    if (Number(signal) <= 0) return;
    document.getElementById(elementId)?.scrollIntoView({ block: 'nearest' });
  }, [menuIdAndSignal]);
}

// MENU

function SchemaMenu({
  schemaEditorState,
  dispatchSchemaEditorState,
  onAddOrRenameType,
  onAddOrRenameIndex,
  onAddOrRenamePattern,
}: {
  schemaEditorState: Readonly<SchemaEditorState>;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onAddOrRenameType: (selector: SchemaTypeSelector) => void;
  onAddOrRenameIndex: (selector: SchemaIndexSelector) => void;
  onAddOrRenamePattern: (selector: SchemaPatternSelector) => void;
}) {
  const { activeSelector, entityTypes, componentTypes, indexes, patterns } = schemaEditorState;
  return (
    <>
      {entityTypes.length > 0 ? (
        <SchemaMenuGroup label="Entity types">
          {entityTypes.map((typeDraft) => {
            const selector = { kind: 'entity', typeName: typeDraft.name } as const;
            return (
              <SchemaMenuItem
                key={typeDraft.name}
                activeSelector={activeSelector}
                selector={selector}
                status={typeDraft.status}
                dispatchSchemaEditorState={dispatchSchemaEditorState}
                dropdownItems={[
                  { title: 'Rename type', onSelect: () => onAddOrRenameType(selector) },
                  {
                    title: 'Delete type',
                    onSelect: () =>
                      dispatchSchemaEditorState(new SchemaEditorActions.DeleteType(selector)),
                  },
                ]}
              >
                {typeDraft.name}
              </SchemaMenuItem>
            );
          })}
        </SchemaMenuGroup>
      ) : null}
      {componentTypes.length > 0 ? (
        <SchemaMenuGroup label="Component types">
          {componentTypes.map((typeDraft) => {
            const selector = { kind: 'component', typeName: typeDraft.name } as const;
            return (
              <SchemaMenuItem
                key={typeDraft.name}
                activeSelector={activeSelector}
                selector={selector}
                status={typeDraft.status}
                dispatchSchemaEditorState={dispatchSchemaEditorState}
                dropdownItems={[
                  { title: 'Rename type', onSelect: () => onAddOrRenameType(selector) },
                  {
                    title: 'Delete type',
                    onSelect: () =>
                      dispatchSchemaEditorState(new SchemaEditorActions.DeleteType(selector)),
                  },
                ]}
              >
                {typeDraft.name}
              </SchemaMenuItem>
            );
          })}
        </SchemaMenuGroup>
      ) : null}
      {indexes.length > 0 ? (
        <SchemaMenuGroup label="Indexes">
          {indexes.map((indexDraft) => {
            const selector = { kind: 'index', name: indexDraft.name } as const;
            return (
              <SchemaMenuItem
                key={indexDraft.name}
                activeSelector={activeSelector}
                selector={selector}
                status={indexDraft.status}
                dispatchSchemaEditorState={dispatchSchemaEditorState}
                dropdownItems={[
                  { title: 'Rename index', onSelect: () => onAddOrRenameIndex(selector) },
                  {
                    title: 'Delete index',
                    onSelect: () =>
                      dispatchSchemaEditorState(new SchemaEditorActions.DeleteIndex(selector)),
                  },
                ]}
              >
                {indexDraft.name}
              </SchemaMenuItem>
            );
          })}
        </SchemaMenuGroup>
      ) : null}
      {patterns.length > 0 ? (
        <SchemaMenuGroup label="Patterns">
          {patterns.map((patternDraft) => {
            const selector = { kind: 'pattern', name: patternDraft.name } as const;
            return (
              <SchemaMenuItem
                key={patternDraft.name}
                activeSelector={activeSelector}
                selector={selector}
                status={patternDraft.status}
                dispatchSchemaEditorState={dispatchSchemaEditorState}
                dropdownItems={[
                  { title: 'Rename pattern', onSelect: () => onAddOrRenamePattern(selector) },
                  {
                    title: 'Delete pattern',
                    onSelect: () =>
                      dispatchSchemaEditorState(new SchemaEditorActions.DeletePattern(selector)),
                  },
                ]}
              >
                {patternDraft.name}
              </SchemaMenuItem>
            );
          })}
        </SchemaMenuGroup>
      ) : null}
    </>
  );
}

function SchemaMenuGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}

function SchemaMenuItem({
  activeSelector,
  selector,
  status,
  dispatchSchemaEditorState,
  dropdownItems,
  children,
}: {
  activeSelector: SchemaSelector | null;
  selector: SchemaSelector;
  status: 'new' | '' | 'changed';
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  dropdownItems: { title: string; onSelect: () => void }[];
  children: React.ReactNode;
}) {
  const isActive = isSelectorActive(selector, activeSelector);
  return (
    <div
      id={getElementIdForSelector(selector, 'menuItem')}
      className={cn(
        'hover:bg-accent flex items-center gap-1 rounded-sm border',
        isActive && 'bg-accent',
      )}
    >
      <button
        className="flex grow items-center gap-2 overflow-hidden p-2 text-start"
        onClick={() =>
          dispatchSchemaEditorState(
            new SchemaEditorActions.SetActiveSelector(selector, false, true),
          )
        }
      >
        <span className="grow overflow-hidden text-ellipsis whitespace-nowrap">{children}</span>
        {status !== '' ? <TypeDraftStatusBadge status={status} /> : null}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Actions">
            <EllipsisVerticalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {dropdownItems.map((item) => (
            <DropdownMenuItem key={item.title} onSelect={item.onSelect}>
              {item.title}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function isSelectorActive(selector: SchemaSelector, activeSelector: null | SchemaSelector) {
  if (!activeSelector) return false;
  if (selector.kind !== activeSelector.kind) return false;
  if ('name' in selector && 'name' in activeSelector) {
    return selector.name === activeSelector.name;
  }
  if ('typeName' in selector && 'typeName' in activeSelector) {
    return selector.typeName === activeSelector.typeName;
  }
  return false;
}

// EDITOR SECTIONS

function EditorSectionHeader({
  id,
  title,
  subtitle,
  status,
  dropdownItems,
}: {
  id: string | undefined;
  title: string;
  subtitle: string;
  status: 'new' | '' | 'changed';
  dropdownItems: { title: string; onSelect: () => void }[];
}) {
  return (
    <div id={id} className="flex scroll-mt-2 items-center gap-2">
      <h2 className="text-xl font-semibold">
        {title} <span className="text-muted-foreground text-sm font-normal">{subtitle}</span>
      </h2>
      <div className="flex grow items-center justify-end gap-2">
        {status !== '' ? <TypeDraftStatusBadge status={status} /> : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Actions">
              <EllipsisVerticalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {dropdownItems.map((item) => (
              <DropdownMenuItem key={item.title} onSelect={item.onSelect}>
                {item.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function TypeEditorSection({
  typeDraft,
  schemaEditorState,
  dispatchSchemaEditorState,
  onAddOrRenameType,
  onAddOrRenameField,
}: {
  typeDraft: SchemaEntityTypeDraft | SchemaComponentTypeDraft;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onAddOrRenameType: (selector: SchemaTypeSelector) => void;
  onAddOrRenameField: (selector: SchemaFieldSelector | SchemaTypeSelector) => void;
}) {
  const typeSelector: SchemaTypeSelector = { kind: typeDraft.kind, typeName: typeDraft.name };
  return (
    <section
      className="flex flex-col gap-2"
      onClick={() =>
        dispatchSchemaEditorState(
          new SchemaEditorActions.SetActiveSelector(typeSelector, true, false),
        )
      }
    >
      <EditorSectionHeader
        id={getElementIdForSelector(typeSelector, 'header')}
        title={typeDraft.name}
        subtitle={typeDraft.kind === 'entity' ? 'Entity type' : 'Component type'}
        status={typeDraft.status}
        dropdownItems={[
          { title: 'Rename type', onSelect: () => onAddOrRenameType(typeSelector) },
          {
            title: 'Delete type',
            onSelect: () =>
              dispatchSchemaEditorState(new SchemaEditorActions.DeleteType(typeSelector)),
          },
        ]}
      />
      <SchemaTypeEditor
        typeSelector={typeSelector}
        typeDraft={typeDraft}
        schemaEditorState={schemaEditorState}
        dispatchSchemaEditorState={dispatchSchemaEditorState}
        onAddOrRenameField={onAddOrRenameField}
      />
    </section>
  );
}

function IndexEditorSection({
  indexDraft,
  dispatchSchemaEditorState,
  onAddOrRenameIndex,
}: {
  indexDraft: SchemaIndexDraft;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onAddOrRenameIndex: (selector: SchemaIndexSelector) => void;
}) {
  const indexSelector: SchemaIndexSelector = { kind: 'index', name: indexDraft.name };
  return (
    <section
      className="flex flex-col gap-2"
      onClick={() =>
        dispatchSchemaEditorState(
          new SchemaEditorActions.SetActiveSelector(indexSelector, true, false),
        )
      }
    >
      <EditorSectionHeader
        id={getElementIdForSelector(indexSelector, 'header')}
        title={indexDraft.name}
        subtitle="Index"
        status={indexDraft.status}
        dropdownItems={[
          { title: 'Rename index', onSelect: () => onAddOrRenameIndex(indexSelector) },
          {
            title: 'Delete index',
            onSelect: () =>
              dispatchSchemaEditorState(new SchemaEditorActions.DeleteIndex(indexSelector)),
          },
        ]}
      />
      <SchemaIndexEditor indexDraft={indexDraft} />
    </section>
  );
}

function PatternEditorSection({
  patternDraft,
  dispatchSchemaEditorState,
  onAddOrRenamePattern,
  onEditPattern,
}: {
  patternDraft: SchemaPatternDraft;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onAddOrRenamePattern: (selector: SchemaPatternSelector) => void;
  onEditPattern: (selector: SchemaPatternSelector) => void;
}) {
  const patternSelector: SchemaPatternSelector = { kind: 'pattern', name: patternDraft.name };
  return (
    <section
      className="flex flex-col gap-2"
      onClick={() =>
        dispatchSchemaEditorState(
          new SchemaEditorActions.SetActiveSelector(patternSelector, true, false),
        )
      }
    >
      <EditorSectionHeader
        id={getElementIdForSelector(patternSelector, 'header')}
        title={patternDraft.name}
        subtitle="Pattern"
        status={patternDraft.status}
        dropdownItems={[
          { title: 'Rename pattern', onSelect: () => onAddOrRenamePattern(patternSelector) },
          {
            title: 'Delete pattern',
            onSelect: () =>
              dispatchSchemaEditorState(new SchemaEditorActions.DeletePattern(patternSelector)),
          },
        ]}
      />
      <SchemaPatternEditor
        patternDraft={patternDraft}
        onEditPattern={() => onEditPattern(patternSelector)}
      />
    </section>
  );
}
