import type { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import {
  Block,
  Button,
  Columns,
  Container,
  Dropdown,
  Icon,
  Navbar,
  Pagination,
  Table,
  Tag,
} from 'react-bulma-components';
import { IconImage } from '../../components/IconImage';

interface ScreenProps {
  children: JSX.Element | JSX.Element[];
}

function Screen({ children }: ScreenProps): JSX.Element {
  return <>{children}</>;
}

const meta: Meta<ScreenProps> = {
  title: 'Screens/Entity list',
  component: Screen,
  args: {},
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

const Template: Story<ScreenProps> = (args) => {
  return (
    <Screen {...args}>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar>
          <Navbar.Brand>
            <Navbar.Item>Data data</Navbar.Item>
          </Navbar.Brand>
          <Navbar.Item>Entities</Navbar.Item>
        </Navbar>
        <div style={{ overflowY: 'scroll', flexGrow: 1, height: '0' }}>
          <Container className="is-flex is-flex-grow-1" flexDirection="column">
            <Columns gap={1 as unknown as undefined}>
              <Columns.Column>
                <p className="control has-icons-left">
                  <input className="input" type="text" placeholder="Search" />
                  <Icon size="small" align="left">
                    <IconImage icon="search" />
                  </Icon>
                </p>
              </Columns.Column>
              <Columns.Column narrow>
                <Dropdown
                  label="Type"
                  icon={
                    <Icon>
                      <IconImage icon="chevronDown" />
                    </Icon>
                  }
                >
                  <Dropdown.Item renderAs="a" value="foo">
                    Show all
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item renderAs="a" value="foo">
                    Foo
                  </Dropdown.Item>
                </Dropdown>
              </Columns.Column>
              <Columns.Column narrow>
                <Dropdown
                  label="Status"
                  icon={
                    <Icon>
                      <IconImage icon="chevronDown" />
                    </Icon>
                  }
                >
                  <Dropdown.Item renderAs="a" value="foo">
                    Show all
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item renderAs="a" value="draft">
                    <Tag color="light">Draft</Tag>
                  </Dropdown.Item>
                  <Dropdown.Item renderAs="a" value="draft">
                    <Tag color="success">Published</Tag>
                  </Dropdown.Item>
                  <Dropdown.Item renderAs="a" value="draft">
                    <Tag color="warning">Modified</Tag>
                  </Dropdown.Item>
                  <Dropdown.Item renderAs="a" value="draft">
                    <Tag color="light">Withdrawn</Tag>
                  </Dropdown.Item>
                  <Dropdown.Item renderAs="a" value="draft">
                    <Tag color="danger">Archived</Tag>
                  </Dropdown.Item>
                </Dropdown>
              </Columns.Column>
              <Columns.Column narrow>
                <Button>
                  <Icon size="small" align="left">
                    <IconImage icon="map" />
                  </Icon>
                </Button>
              </Columns.Column>
            </Columns>

            <EntityTypesList />
            <Table size="fullwidth">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th className="narrow-cell">Status</th>
                  <th className="narrow-cell">Created</th>
                  <th className="narrow-cell">Updated</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(50).keys()].map((_, index) => (
                  <tr key={index}>
                    <td>Hello</td>
                    <td>BlogPost</td>
                    <td className="narrow-cell">
                      <Tag color="success">Published</Tag>
                    </td>
                    <td className="narrow-cell">Today</td>
                    <td className="narrow-cell">Today</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Container>
        </div>
        <Container className="is-flex-grow-0">
          <Pagination current={3} showFirstLast total={5} />
        </Container>
      </div>
    </Screen>
  );
};

function EntityTypesList() {
  const types = ['Hello', 'World'];
  return (
    <Block>
      <Columns>
        <Columns.Column>
          <div className="field is-grouped">
            {types.map((type) => (
              <div key={type} className="control">
                <Tag.Group hasAddons>
                  <Tag>{type}</Tag>
                  <Tag remove />
                </Tag.Group>
              </div>
            ))}
            <div className="control">
              <Tag.Group hasAddons>
                <Tag color="primary">Show all</Tag>
              </Tag.Group>
            </div>
          </div>
        </Columns.Column>
        <Columns.Column narrow>
          <Dropdown
            label="Add type"
            icon={
              <Icon>
                <IconImage icon="chevronDown" />
              </Icon>
            }
          >
            <Dropdown.Item renderAs="a" value="foo">
              Foo
            </Dropdown.Item>
          </Dropdown>
        </Columns.Column>
      </Columns>
    </Block>
  );
}

export const Normal = Template.bind({});
