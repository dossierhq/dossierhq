import {
  EventType,
  isFieldValueEqual,
  type AdminEntity,
  type AdminEntityTypeSpecification,
  type ChangelogQuery,
  type EntityReference,
} from '@dossierhq/core';
import {
  Card2,
  Dialog2,
  FullscreenContainer,
  IconButton,
  SelectDisplay,
  Text,
} from '@dossierhq/design';
import { useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { AdminDossierContext } from '../../contexts/AdminDossierContext.js';
import { useAdminChangelogEvents } from '../../hooks/useAdminChangelogEvents.js';
import { useAdminEntity } from '../../hooks/useAdminEntity.js';
import {
  VersionSelectionAction,
  initializeVersionSelectionState,
  reduceVersionSelectionState,
  type VersionItem,
} from './VersionSelectionReducer.js';

interface AdminEntityHistoryDialogProps {
  reference: EntityReference | null;
}

export function AdminEntityHistoryDialog({ reference }: AdminEntityHistoryDialogProps) {
  return (
    <Dialog2 width="wide" height="fill">
      {({ close }) => (
        <FullscreenContainer card height="100%">
          <FullscreenContainer.Row flexDirection="row" alignItems="center">
            <FullscreenContainer.Item flexGrow={1} paddingHorizontal={3} paddingVertical={2}>
              <Text textStyle="headline5">Entity history</Text>
            </FullscreenContainer.Item>
            <IconButton icon="close" color="white" onClick={close} />
          </FullscreenContainer.Row>
          {reference ? <Content reference={reference} /> : null}
        </FullscreenContainer>
      )}
    </Dialog2>
  );
}

function Content({ reference }: { reference: EntityReference }) {
  const { adminClient, schema } = useContext(AdminDossierContext);
  const [
    { leftVersion, leftVersionItems, rightVersion, rightVersionItems },
    dispatchVersionSelectionState,
  ] = useReducer(reduceVersionSelectionState, reference, initializeVersionSelectionState);

  const handleLeftVersionChange = useCallback((version: number) => {
    dispatchVersionSelectionState(new VersionSelectionAction.ChangeLeftVersion(version));
  }, []);
  const handleRightVersionChange = useCallback((version: number) => {
    dispatchVersionSelectionState(new VersionSelectionAction.ChangeRightVersion(version));
  }, []);

  // TODO deal with paging of changelog events?
  const query = useMemo<ChangelogQuery>(() => {
    return {
      entity: { id: reference.id },
      types: [
        EventType.createEntity,
        EventType.createAndPublishEntity,
        EventType.updateEntity,
        EventType.updateAndPublishEntity,
      ],
      reverse: true,
    };
  }, [reference.id]);

  const { connection, connectionError: _ } = useAdminChangelogEvents(adminClient, query, undefined);

  const { entity: leftEntity } = useAdminEntity(
    adminClient,
    leftVersion !== null ? { id: reference.id, version: leftVersion } : undefined,
  );
  const { entity: rightEntity } = useAdminEntity(
    adminClient,
    rightVersion !== null ? { id: reference.id, version: rightVersion } : undefined,
  );

  const entitySpec =
    schema && leftEntity ? schema.getEntityTypeSpecification(leftEntity.info.type) : null;

  useEffect(() => {
    if (connection)
      dispatchVersionSelectionState(new VersionSelectionAction.UpdateVersionHistory(connection));
  }, [connection]);

  return (
    <>
      <FullscreenContainer.Row center flexDirection="row" gap={2} paddingVertical={2}>
        <VersionSelect
          version={leftVersion}
          items={leftVersionItems}
          onChange={handleLeftVersionChange}
        />
        <VersionSelect
          version={rightVersion}
          items={rightVersionItems}
          onChange={handleRightVersionChange}
        />
      </FullscreenContainer.Row>
      <FullscreenContainer.ScrollableRow>
        <FullscreenContainer.Row>
          <FullscreenContainer.Item paddingHorizontal={3}>
            {entitySpec && leftEntity && rightEntity ? (
              <DiffEntities
                entitySpec={entitySpec}
                leftEntity={leftEntity as AdminEntity}
                rightEntity={rightEntity as AdminEntity}
              />
            ) : null}
          </FullscreenContainer.Item>
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
    </>
  );
}

function VersionSelect({
  version,
  items,
  onChange,
}: {
  version: number | null;
  items: VersionItem[];
  onChange: (version: number) => void;
}) {
  return (
    <SelectDisplay
      value={version ?? undefined}
      onChange={(event) => onChange(Number.parseInt(event.target.value))}
    >
      {items.map((it) => (
        <SelectDisplay.Option key={it.version} value={it.version} disabled={!it.enabled}>
          {it.version}
        </SelectDisplay.Option>
      ))}
    </SelectDisplay>
  );
}

function DiffEntities({
  entitySpec,
  leftEntity,
  rightEntity,
}: {
  entitySpec: AdminEntityTypeSpecification;
  leftEntity: AdminEntity;
  rightEntity: AdminEntity;
}) {
  const equalFields: string[] = [];

  const diffFields = entitySpec.fields.map((fieldSpec) => {
    const leftValue = leftEntity.fields[fieldSpec.name];
    const rightValue = rightEntity.fields[fieldSpec.name];
    if (isFieldValueEqual(leftValue, rightValue)) {
      equalFields.push(fieldSpec.name);
      return null;
    }
    return (
      <Card2 key={fieldSpec.name}>
        <Card2.Header>
          <Card2.HeaderTitle>{fieldSpec.name}</Card2.HeaderTitle>
        </Card2.Header>
        <Card2.Content>
          <pre>{JSON.stringify(leftValue, null, 2)}</pre>
          <hr />
          <pre>{JSON.stringify(rightValue, null, 2)}</pre>
        </Card2.Content>
      </Card2>
    );
  });

  return (
    <>
      {leftEntity.info.name !== rightEntity.info.name ? (
        <Card2>
          <Card2.Header>Entity name</Card2.Header>
          <Card2.Content>
            {leftEntity.info.name}
            <hr />
            {rightEntity.info.name}
          </Card2.Content>
        </Card2>
      ) : null}
      {equalFields.length > 0 ? `These fields were equal: ${equalFields.join(', ')}` : null}
      {diffFields}
    </>
  );
}
