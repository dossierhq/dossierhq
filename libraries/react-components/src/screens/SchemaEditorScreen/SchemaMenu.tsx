import { ClassName, Menu } from '@dossierhq/design';
import type { Dispatch, MouseEvent, ReactNode } from 'react';
import { useCallback } from 'react';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
  SchemaSelector,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';
import {
  SchemaEditorActions,
  getElementIdForSelector,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer.js';

export function SchemaMenu({
  schemaEditorState,
  dispatchEditorState,
}: {
  schemaEditorState: Readonly<SchemaEditorState>;
  dispatchEditorState: Dispatch<SchemaEditorStateAction>;
}) {
  const { activeSelector, entityTypes, valueTypes, indexes, patterns } = schemaEditorState;
  return (
    <Menu>
      {entityTypes.length > 0 ? (
        <>
          <Menu.Label>Entity types</Menu.Label>
          <Menu.List>
            {entityTypes.map((typeDraft) => (
              <DraftItem
                key={typeDraft.name}
                {...{
                  activeSelector,
                  selector: { kind: 'entity', typeName: typeDraft.name },
                  dispatchEditorState,
                }}
              >
                {typeDraft.name}
              </DraftItem>
            ))}
          </Menu.List>
        </>
      ) : null}
      {valueTypes.length > 0 ? (
        <>
          <Menu.Label>Value types</Menu.Label>
          <Menu.List>
            {valueTypes.map((typeDraft) => (
              <DraftItem
                key={typeDraft.name}
                {...{
                  activeSelector,
                  selector: { kind: 'value', typeName: typeDraft.name },
                  dispatchEditorState,
                }}
              >
                {typeDraft.name}
              </DraftItem>
            ))}
          </Menu.List>
        </>
      ) : null}
      {indexes.length > 0 ? (
        <>
          <Menu.Label>Indexes</Menu.Label>
          <Menu.List>
            {indexes.map((indexDraft) => (
              <DraftItem
                key={indexDraft.name}
                {...{
                  activeSelector,
                  selector: { kind: 'index', name: indexDraft.name },
                  dispatchEditorState,
                }}
              >
                {indexDraft.name}
              </DraftItem>
            ))}
          </Menu.List>
        </>
      ) : null}
      {patterns.length > 0 ? (
        <>
          <Menu.Label>Patterns</Menu.Label>
          <Menu.List>
            {patterns.map((patternDraft) => (
              <DraftItem
                key={patternDraft.name}
                {...{
                  activeSelector,
                  selector: { kind: 'pattern', name: patternDraft.name },
                  dispatchEditorState,
                }}
              >
                {patternDraft.name}
              </DraftItem>
            ))}
          </Menu.List>
        </>
      ) : null}
    </Menu>
  );
}

function DraftItem({
  activeSelector,
  selector,
  dispatchEditorState,
  children,
}: {
  activeSelector: SchemaSelector | null;
  selector: SchemaSelector;
  dispatchEditorState: Dispatch<SchemaEditorStateAction>;
  children: ReactNode;
}) {
  const handleClick = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      dispatchEditorState(new SchemaEditorActions.SetActiveSelector(selector, false, true));
    },
    [dispatchEditorState, selector],
  );
  return (
    <Menu.Item>
      <a
        id={getElementIdForSelector(selector, 'menuItem')}
        className={isDraftActive(selector, activeSelector) ? ClassName['is-active'] : undefined}
        onClick={handleClick}
      >
        {children}
      </a>
    </Menu.Item>
  );
}

function isDraftActive(selector: SchemaSelector, activeSelector: null | SchemaSelector) {
  if (!activeSelector) return false;
  if (selector.kind !== activeSelector.kind) return false;
  if (selector.kind === 'index' && activeSelector.kind === 'index') {
    return selector.name === activeSelector.name;
  }
  if (selector.kind === 'pattern' && activeSelector.kind === 'pattern') {
    return selector.name === activeSelector.name;
  }
  if (
    (selector.kind === 'entity' && activeSelector.kind === 'entity') ||
    (selector.kind === 'value' && activeSelector.kind === 'value')
  ) {
    return selector.typeName === activeSelector.typeName;
  }
}
