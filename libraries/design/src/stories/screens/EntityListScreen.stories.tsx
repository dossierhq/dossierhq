import type { Meta, Story } from '@storybook/react/types-6-0';
import type { MouseEvent } from 'react';
import React, { useReducer } from 'react';
import { Container, Navbar, Tag } from 'react-bulma-components';
import {
  Dropdown,
  IconButton,
  Input,
  MultipleSelectorStateActions,
  reduceMultipleSelectorState,
  Table,
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar>
        <Navbar.Brand>
          <Navbar.Item>Data data</Navbar.Item>
        </Navbar.Brand>
        <Navbar.Item>Entities</Navbar.Item>
      </Navbar>
      <Container className="is-flex is-flex-grow-0 pt-2" flexDirection="column">
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
      </Container>
      <div style={{ overflowY: 'scroll', flexGrow: 1, height: '0' }}>
        <Container className="is-flex" flexDirection="column">
          <EntityTypesList state={entityTypeFilterState} dispatch={entityTypeFilterDispatch} />
          <StatusTagList state={statusFilterState} dispatch={statusFilterDispatch} />
          <EntityTable {...{ entityCount, onTableRowClick }} />
        </Container>
      </div>
      <Container className="is-flex-grow-0">
        <IconButton.Group condensed>
          <IconButton icon="first" />
          <IconButton icon="previous" />
          <IconButton icon="next" />
          <IconButton icon="last" />
        </IconButton.Group>
      </Container>
    </div>
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
    <div className="is-flex is-flex-wrap-wrap g-2">
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
              <Tag color="success">Published</Tag>
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
      <div className="field is-grouped">
        {types.map(({ id, name }) => (
          <div key={id} className="control">
            <Tag.Group hasAddons>
              <Tag>{name}</Tag>
              <Tag
                className="is-clickable"
                remove
                onClick={() => dispatch(new MultipleSelectorStateActions.ToggleItem(id))}
              />
            </Tag.Group>
          </div>
        ))}
        <Tag.Group>
          <Tag
            className="is-clickable"
            color="white"
            onClick={() => dispatch(new MultipleSelectorStateActions.ClearSelection())}
          >
            Clear
          </Tag>
        </Tag.Group>
      </div>
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
      <div className="field is-grouped">
        {statuses.map(({ id, name, color }) => (
          <div key={id} className="control">
            <Tag.Group hasAddons>
              <Tag color={color}>{name}</Tag>
              <Tag
                className="is-clickable"
                remove
                onClick={() => dispatch(new MultipleSelectorStateActions.ToggleItem(id))}
              />
            </Tag.Group>
          </div>
        ))}
        <Tag.Group>
          <Tag
            className="is-clickable"
            color="white"
            onClick={() => dispatch(new MultipleSelectorStateActions.ClearSelection())}
          >
            Clear
          </Tag>
        </Tag.Group>
      </div>
    </>
  );
}

export const Normal = Template.bind({});

export const Empty = Template.bind({});
Empty.args = {
  entityCount: 0,
};
