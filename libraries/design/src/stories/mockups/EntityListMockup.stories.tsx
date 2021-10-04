import type { Meta, Story } from '@storybook/react/types-6-0.js';
import type { MouseEvent } from 'react';
import React, { useReducer } from 'react';
import {
  Dropdown,
  Field,
  FullscreenContainer,
  IconButton,
  Input,
  NavBar,
  reduceMultipleSelectorState,
  Table,
  Tag,
  TagSelector,
} from '../../index.js';
import type { EntityTypeSelectorDispatch, EntityTypeSelectorState } from './EntityTypeSelector.js';
import {
  EntityTypeSelector,
  initializeEntityTypeSelectorState,
  reduceEntityTypeSelectorState,
} from './EntityTypeSelector.js';
import type {
  StatusSelectorDispatch,
  StatusSelectorInitArgs,
  StatusSelectorReducer,
  StatusSelectorState,
} from './StatusSelector.js';
import { initializeStatusSelectorState, StatusSelector } from './StatusSelector.js';

interface ScreenProps {
  entityCount: number;
  onMapClick: (event: MouseEvent) => void;
  onCreateClick: (item: { id: string; name: string }) => void;
  onTableRowClick: (event: MouseEvent) => void;
}

const meta: Meta<ScreenProps> = {
  title: 'Mockups/Entity list',
  component: Screen,
  args: {
    entityCount: 50,
  },
  argTypes: {
    onCreateClick: { action: 'clicked' },
    onMapClick: { action: 'clicked' },
    onTableRowClick: { action: 'clicked' },
  },
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template: Story<ScreenProps> = (args) => {
  return <Screen {...args} />;
};

function Screen({
  entityCount,
  onCreateClick,
  onMapClick,
  onTableRowClick,
}: ScreenProps): JSX.Element {
  const [entityTypeFilterState, dispatchEntityTypeFilter] = useReducer(
    reduceEntityTypeSelectorState,
    { selectedIds: ['foo', 'bar'] },
    initializeEntityTypeSelectorState
  );
  const [statusFilterState, statusFilterDispatch] = useReducer<
    StatusSelectorReducer,
    StatusSelectorInitArgs
  >(reduceMultipleSelectorState, { selectedIds: ['published'] }, initializeStatusSelectorState);
  return (
    <FullscreenContainer>
      <FullscreenContainer.Row fullWidth>
        <NavBar>
          <NavBar.Brand>
            <NavBar.Item>{NavItemRender('Data data')}</NavBar.Item>
          </NavBar.Brand>
          <NavBar.Item active>{NavItemRender('Entities')}</NavBar.Item>
        </NavBar>
      </FullscreenContainer.Row>
      <FullscreenContainer.Row center flexDirection="row" gap={2} paddingVertical={2}>
        <SearchBar
          {...{
            entityTypeFilterState,
            dispatchEntityTypeFilter,
            statusFilterState,
            statusFilterDispatch,
            onMapClick,
            onCreateClick,
          }}
        />
      </FullscreenContainer.Row>
      <FullscreenContainer.ScrollableRow>
        <FullscreenContainer.Row paddingVertical={2}>
          <EntityTypesList state={entityTypeFilterState} dispatch={dispatchEntityTypeFilter} />
          <StatusTagList state={statusFilterState} dispatch={statusFilterDispatch} />
          <EntityTable {...{ entityCount, onTableRowClick }} />
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
      <FullscreenContainer.Row center paddingVertical={2}>
        <IconButton.Group condensed>
          <IconButton icon="first" />
          <IconButton icon="previous" />
          <IconButton icon="next" />
          <IconButton icon="last" />
        </IconButton.Group>
      </FullscreenContainer.Row>
    </FullscreenContainer>
  );
}

function NavItemRender(text: string) {
  const renderer = ({ className }: { className: string }) => {
    return <a className={className}>{text}</a>;
  };
  return renderer;
}

function SearchBar({
  entityTypeFilterState,
  dispatchEntityTypeFilter,
  statusFilterState,
  statusFilterDispatch,
  onMapClick,
  onCreateClick,
}: {
  entityTypeFilterState: EntityTypeSelectorState;
  dispatchEntityTypeFilter: EntityTypeSelectorDispatch;
  statusFilterState: StatusSelectorState;
  statusFilterDispatch: StatusSelectorDispatch;
  onMapClick: (event: MouseEvent) => void;
  onCreateClick: (item: { id: string; name: string }) => void;
}) {
  return (
    <>
      <Input iconLeft="search" placeholder="Search" />
      <EntityTypeSelector state={entityTypeFilterState} dispatch={dispatchEntityTypeFilter}>
        Entity type
      </EntityTypeSelector>
      <StatusSelector state={statusFilterState} dispatch={statusFilterDispatch}>
        Status
      </StatusSelector>
      <IconButton icon="map" onClick={onMapClick} />
      <Dropdown
        iconLeft="add"
        left
        items={[
          { id: 'foo', name: 'Foo' },
          { id: 'bar', name: 'Bar' },
        ]}
        renderItem={(it) => it.name}
        onItemClick={onCreateClick}
      >
        Create
      </Dropdown>
    </>
  );
}

function EntityTable({
  entityCount,
  onTableRowClick,
}: {
  entityCount: number;
  onTableRowClick: (event: MouseEvent) => void;
}) {
  return (
    <Table>
      <Table.Head>
        <Table.Row sticky>
          <Table.Header order="asc">Name</Table.Header>
          <Table.Header order="">Entity type</Table.Header>
          <Table.Header narrow>Status</Table.Header>
          <Table.Header narrow order="">
            Created
          </Table.Header>
          <Table.Header narrow order="">
            Updated
          </Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {[...Array(entityCount).keys()].map((_, index) => (
          <Table.Row key={index} clickable onClick={onTableRowClick}>
            <Table.Cell>Hello</Table.Cell>
            <Table.Cell>BlogPost</Table.Cell>
            <Table.Cell narrow>
              <Tag color="published">Published</Tag>
            </Table.Cell>
            <Table.Cell narrow>Today</Table.Cell>
            <Table.Cell narrow>Today</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

function EntityTypesList({
  state,
  dispatch,
}: {
  state: EntityTypeSelectorState;
  dispatch: EntityTypeSelectorDispatch;
}) {
  if (state.selectedIds.length === 0) {
    return null;
  }

  return (
    <Field>
      <Field.Label size="small">Show entity types</Field.Label>
      <Field.Control>
        <TagSelector
          clearLabel="Clear"
          itemTag={(item) => ({ tag: item.name })}
          state={state}
          dispatch={dispatch}
        />
      </Field.Control>
    </Field>
  );
}

function StatusTagList({
  state,
  dispatch,
}: {
  state: StatusSelectorState;
  dispatch: StatusSelectorDispatch;
}) {
  if (state.selectedIds.length === 0) {
    return null;
  }

  return (
    <Field>
      <Field.Label size="small">Show entities with status</Field.Label>
      <Field.Control>
        <TagSelector
          clearLabel="Clear"
          itemTag={(item) => ({ tag: item.name, color: item.color })}
          state={state}
          dispatch={dispatch}
        />
      </Field.Control>
    </Field>
  );
}

export const Normal = Template.bind({});

export const Empty = Template.bind({});
Empty.args = {
  entityCount: 0,
};
