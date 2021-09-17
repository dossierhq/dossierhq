import type { Meta, Story } from '@storybook/react/types-6-0';
import type { MouseEvent } from 'react';
import React, { useReducer } from 'react';
import { Navbar } from 'react-bulma-components';
import {
  Dropdown,
  FullscreenContainer,
  IconButton,
  Input,
  MultipleSelectorStateActions,
  reduceMultipleSelectorState,
  Table,
  Tag,
} from '../..';
import type {
  EntityTypeSelectorDispatch,
  EntityTypeSelectorInitArgs,
  EntityTypeSelectorReducer,
  EntityTypeSelectorState,
} from './EntityTypeSelector';
import { EntityTypeSelector, initializeEntityTypeSelectorState } from './EntityTypeSelector';
import type {
  StatusSelectorDispatch,
  StatusSelectorInitArgs,
  StatusSelectorReducer,
  StatusSelectorState,
} from './StatusSelector';
import { initializeStatusSelectorState, StatusSelector } from './StatusSelector';

interface ScreenProps {
  entityCount: number;
  onMapClick: (event: MouseEvent) => void;
  onCreateClick: (item: { id: string; name: string }) => void;
  onTableRowClick: (event: MouseEvent) => void;
}

const meta: Meta<ScreenProps> = {
  title: 'Screens/Entity list',
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
  const [entityTypeFilterState, entityTypeFilterDispatch] = useReducer<
    EntityTypeSelectorReducer,
    EntityTypeSelectorInitArgs
  >(
    reduceMultipleSelectorState,
    { selectedIds: ['foo', 'bar'] },
    initializeEntityTypeSelectorState
  );
  const [statusFilterState, statusFilterDispatch] = useReducer<
    StatusSelectorReducer,
    StatusSelectorInitArgs
  >(reduceMultipleSelectorState, { selectedIds: ['published'] }, initializeStatusSelectorState);
  return (
    <FullscreenContainer>
      <Navbar>
        <Navbar.Brand>
          <Navbar.Item>Data data</Navbar.Item>
        </Navbar.Brand>
        <Navbar.Item>Entities</Navbar.Item>
      </Navbar>
      <FullscreenContainer.Row center>
        <SearchBar
          {...{
            entityTypeFilterState,
            entityTypeFilterDispatch,
            statusFilterState,
            statusFilterDispatch,
            onMapClick,
            onCreateClick,
          }}
        />
      </FullscreenContainer.Row>
      <FullscreenContainer.Row scrollable>
        <EntityTypesList state={entityTypeFilterState} dispatch={entityTypeFilterDispatch} />
        <StatusTagList state={statusFilterState} dispatch={statusFilterDispatch} />
        <EntityTable {...{ entityCount, onTableRowClick }} />
      </FullscreenContainer.Row>
      <FullscreenContainer.Row center>
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

function SearchBar({
  entityTypeFilterState,
  entityTypeFilterDispatch,
  statusFilterState,
  statusFilterDispatch,
  onMapClick,
  onCreateClick,
}: {
  entityTypeFilterState: EntityTypeSelectorState;
  entityTypeFilterDispatch: EntityTypeSelectorDispatch;
  statusFilterState: StatusSelectorState;
  statusFilterDispatch: StatusSelectorDispatch;
  onMapClick: (event: MouseEvent) => void;
  onCreateClick: (item: { id: string; name: string }) => void;
}) {
  return (
    <div className="is-flex g-2 pt-2">
      <Input iconLeft="search" placeholder="Search" />
      <EntityTypeSelector state={entityTypeFilterState} dispatch={entityTypeFilterDispatch}>
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
    </div>
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
  const { items, selectedIds } = state;
  if (selectedIds.length === 0) {
    return null;
  }

  const types = items.filter(({ id }) => selectedIds.includes(id));
  return (
    <>
      <p className="is-size-7 has-text-weight-semibold">Show entity types:</p>
      <Tag.Group>
        {types.map(({ id, name }) => (
          <Tag key={id}>
            {name}
            <Tag.Remove onClick={() => dispatch(new MultipleSelectorStateActions.ToggleItem(id))} />
          </Tag>
        ))}
        <Tag.Clear onClick={() => dispatch(new MultipleSelectorStateActions.ClearSelection())}>
          Clear
        </Tag.Clear>
      </Tag.Group>
    </>
  );
}

function StatusTagList({
  state,
  dispatch,
}: {
  state: StatusSelectorState;
  dispatch: StatusSelectorDispatch;
}) {
  const { items, selectedIds } = state;
  if (selectedIds.length === 0) {
    return null;
  }

  const statuses = items.filter(({ id }) => selectedIds.includes(id));
  return (
    <>
      <p className="is-size-7 has-text-weight-semibold">Show entities with status:</p>
      <Tag.Group>
        {statuses.map(({ id, name, color }) => (
          <Tag key={id} color={color}>
            {name}
            <Tag.Remove onClick={() => dispatch(new MultipleSelectorStateActions.ToggleItem(id))} />
          </Tag>
        ))}
        <Tag.Clear onClick={() => dispatch(new MultipleSelectorStateActions.ClearSelection())}>
          Clear
        </Tag.Clear>
      </Tag.Group>
    </>
  );
}

export const Normal = Template.bind({});

export const Empty = Template.bind({});
Empty.args = {
  entityCount: 0,
};
