import type { EntityVersionInfo } from '@datadata/core';
import { assertIsDefined } from '@datadata/core';
import React, { useContext, useState } from 'react';
import {
  Button,
  Column,
  ColumnItem,
  DataDataContext,
  DropDown,
  EntityEditorStateContext,
  Loader,
  Message,
  PublishStateTag,
  Row,
  RowElement,
  Stack,
  Tag,
} from '../..';
import type { DropDownItem } from '../..';
import { joinClassNames } from '../../utils/ClassNameUtils';
import type { EntityEditorDraftState } from '../EntityEditor/EntityEditorReducer';
import { PublishingButton } from './PublishingButton';

export interface EntityMetadataProps {
  entityId: string;
  className?: string;
  initialSelectedHistory?: 'entity' | 'publish';
}

export function EntityMetadata({
  entityId,
  className,
  initialSelectedHistory,
}: EntityMetadataProps): JSX.Element {
  const { drafts } = useContext(EntityEditorStateContext);
  const draftState = drafts.find((x) => x.id === entityId);
  assertIsDefined(draftState);

  const [selectedHistory, setSelectedHistory] = useState<'entity' | 'publish'>(
    initialSelectedHistory ?? 'entity'
  );
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);

  const { entity, latestServerVersion, publishState } = draftState;

  return (
    <Column className={joinClassNames('has-shadow has-background py-2', className)} gap={2}>
      <ColumnItem className="mx-2">
        <p className="dd text-subtitle2">Name</p>
        <p className="dd text-body1">{entity?.name}</p>
      </ColumnItem>
      <ColumnItem className="mx-2">
        <p className="dd text-subtitle2">Type</p>
        <p className="dd text-body1">{entity?.entitySpec.name}</p>
      </ColumnItem>
      <ColumnItem className="mx-2">
        <p className="dd text-subtitle2">ID</p>
        <p className="dd text-body1">{entityId}</p>
      </ColumnItem>
      <ColumnItem className="mx-2">
        <Row>
          <RowElement as="p" className="text-subtitle2" grow>
            Publish state
          </RowElement>
          {publishState ? <PublishStateTag publishState={publishState} /> : null}
        </Row>
        <PublishingButton {...{ entityId, latestServerVersion, publishState }} />
      </ColumnItem>
      <ColumnItem as={Row} gap={2}>
        <Button
          selected={selectedHistory === 'entity'}
          onClick={() => setSelectedHistory('entity')}
        >
          Entity history
        </Button>
        <Button
          selected={selectedHistory === 'publish'}
          onClick={() => setSelectedHistory('publish')}
        >
          Publish history
        </Button>
      </ColumnItem>
      <ColumnItem as={Column} grow overflowY="scroll">
        {selectedHistory === 'entity' ? (
          <EntityHistoryList
            {...{
              draftState,
              selectedVersionId,
              setSelectedVersionId,
            }}
          />
        ) : null}
        {selectedHistory === 'publish' ? <PublishHistory draftState={draftState} /> : null}
      </ColumnItem>
    </Column>
  );
}

function EntityHistoryList({
  draftState,
  selectedVersionId,
  setSelectedVersionId,
}: {
  draftState: EntityEditorDraftState;
  selectedVersionId: number | null;
  setSelectedVersionId: React.Dispatch<React.SetStateAction<number | null>>;
}) {
  const { useEntityHistory } = useContext(DataDataContext);
  const { entityHistory, entityHistoryError } = useEntityHistory(
    draftState.exists ? draftState.id : undefined
  );

  return (
    <>
      {entityHistory ? (
        entityHistory.versions.map((version) => {
          const selected = version.version === selectedVersionId;
          //TODO change Stack to not need outer <div>
          //TODO change drop down direction to leftwards
          //TODO remove Button and selected item
          return (
            <div key={version.version}>
              <Stack>
                <Button
                  onClick={() => setSelectedVersionId(version.version)}
                  selected={selected}
                  rounded={false}
                >
                  <p className="dd text-subtitle2">
                    Version {version.version}
                    {version.deleted ? <Tag kind="danger" text="Deleted" /> : null}
                    {version.published ? <Tag kind="primary" text="Published" /> : null}
                  </p>
                  <p className="dd text-body1">{version.createdAt.toLocaleString()}</p>
                  <p className="dd text-body1">{version.createdBy}</p>
                </Button>
                <Stack.Layer top right>
                  <PublishButton className="" entityId={draftState.id} version={version} />
                </Stack.Layer>
              </Stack>
            </div>
          );
        })
      ) : !entityHistoryError && draftState.exists ? (
        <Loader />
      ) : null}
      {entityHistoryError ? (
        <Message
          kind="danger"
          message={`${entityHistoryError.error}: ${entityHistoryError.message}`}
        />
      ) : null}
    </>
  );
}

function PublishButton({
  className,
  entityId,
  version: versionInfo,
}: {
  className?: string;
  entityId: string;
  version: EntityVersionInfo;
}) {
  const { publishEntities } = useContext(DataDataContext);
  const { published, version } = versionInfo;

  if (published) {
    return null;
  }

  const handleItemClick = async ({ key }: DropDownItem) => {
    if (key === 'publish') {
      const result = await publishEntities([{ id: entityId, version }]);
    }
    //TODO handle error and loading
  };

  return (
    <DropDown
      id={`${entityId}-${version}-publish`}
      className={className}
      showAsIcon
      text="Version actions"
      items={[{ key: 'publish', text: 'Publish version' }]}
      onItemClick={handleItemClick}
    />
  );
}

function PublishHistory({ draftState }: { draftState: EntityEditorDraftState }) {
  const { usePublishHistory } = useContext(DataDataContext);
  const { publishHistory, publishHistoryError } = usePublishHistory(
    draftState.exists ? draftState.id : undefined
  );

  if (!draftState.exists) {
    return null;
  }
  if (!publishHistory && !publishHistoryError) {
    return <Loader />;
  }
  return (
    <>
      {publishHistory?.events.map((event, index) => {
        return (
          <Column key={index} className="px-2 py-1">
            <p className="dd text-subtitle2">
              {`${event.kind}${event.version !== null ? ` (version ${event.version})` : ''}`}
            </p>
            <p className="dd text-body1">{event.publishedAt.toLocaleString()}</p>
            <p className="dd text-body1">{event.publishedBy}</p>
          </Column>
        );
      })}
      {publishHistoryError ? (
        <Message
          kind="danger"
          message={`${publishHistoryError.error}: ${publishHistoryError.message}`}
        />
      ) : null}
    </>
  );
}
