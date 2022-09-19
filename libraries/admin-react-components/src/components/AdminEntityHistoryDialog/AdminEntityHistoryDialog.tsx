import type {
  AdminEntity,
  AdminEntityTypeSpecification,
  EntityReference,
} from '@jonasb/datadata-core';
import { isFieldValueEqual } from '@jonasb/datadata-core';
import {
  Card2,
  Dialog,
  FullscreenContainer,
  IconButton,
  SelectDisplay,
  Text,
} from '@jonasb/datadata-design';
import { useCallback, useContext, useEffect, useReducer } from 'react';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext';
import { useAdminEntity } from '../../hooks/useAdminEntity.js';
import { useAdminEntityHistory } from '../../hooks/useAdminEntityHistory.js';
import type { VersionItem } from './VersionSelectionReducer.js';
import {
  initializeVersionSelectionState,
  reduceVersionSelectionState,
  VersionSelectionAction,
} from './VersionSelectionReducer.js';

interface AdminEntityHistoryDialogProps {
  show: boolean;
  reference: EntityReference | null;
  onClose: () => void;
}

export function AdminEntityHistoryDialog({
  show,
  reference,
  onClose,
}: AdminEntityHistoryDialogProps) {
  return (
    <Dialog show={show} modal onClose={onClose} width="wide" height="fill">
      <FullscreenContainer card height="100%">
        <FullscreenContainer.Row flexDirection="row" alignItems="center">
          <FullscreenContainer.Item flexGrow={1} paddingHorizontal={3} paddingVertical={2}>
            <Text textStyle="headline5">Entity history</Text>
          </FullscreenContainer.Item>
          <IconButton icon="close" color="white" onClick={onClose} />
        </FullscreenContainer.Row>
        {show && reference ? <Content reference={reference} /> : null}
      </FullscreenContainer>
    </Dialog>
  );
}

function Content({ reference }: { reference: EntityReference }) {
  const { adminClient, schema } = useContext(AdminDataDataContext);
  const [
    { leftVersion, leftVersionItems, rightVersion, rightVersionItems },
    dispatchVersionSelectionState,
  ] = useReducer(reduceVersionSelectionState, undefined, initializeVersionSelectionState);

  const handleLeftVersionChange = useCallback((version: number) => {
    dispatchVersionSelectionState(new VersionSelectionAction.ChangeLeftVersion(version));
  }, []);
  const handleRightVersionChange = useCallback((version: number) => {
    dispatchVersionSelectionState(new VersionSelectionAction.ChangeRightVersion(version));
  }, []);

  const { entityHistory } = useAdminEntityHistory(adminClient, reference ?? undefined);
  const { entity: leftEntity } = useAdminEntity(
    adminClient,
    leftVersion !== null ? { id: reference.id, version: leftVersion } : undefined
  );
  const { entity: rightEntity } = useAdminEntity(
    adminClient,
    rightVersion !== null ? { id: reference.id, version: rightVersion } : undefined
  );

  const entitySpec =
    schema && leftEntity ? schema.getEntityTypeSpecification(leftEntity.info.type) : null;

  useEffect(() => {
    if (entityHistory)
      dispatchVersionSelectionState(new VersionSelectionAction.UpdateVersionHistory(entityHistory));
  }, [entityHistory]);

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
                leftEntity={leftEntity}
                rightEntity={rightEntity}
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
      {equalFields.length > 0 ? `These fields were equal: ${equalFields.join(', ')}` : null}
      {diffFields}
    </>
  );
}
