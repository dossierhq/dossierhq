import type { EntityReference } from '@jonasb/datadata-core';
import { Button, Delete, HoverRevealContainer, Text } from '@jonasb/datadata-design';
import React, { useCallback, useContext } from 'react';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext';
import { useAdminEntity } from '../../hooks/useAdminEntity';
import { StatusTag } from '../StatusTag/StatusTag';
import type { FieldEditorProps } from './FieldEditor';

type Props = FieldEditorProps<EntityReference>;

export function EntityTypeFieldEditor({ value, onChange }: Props) {
  const { adminClient } = useContext(AdminDataDataContext);
  const { entity, entityError: _error } = useAdminEntity(adminClient, value ?? undefined);

  const handleDeleteClick = useCallback(() => onChange(null), [onChange]);

  return (
    <>
      {entity ? (
        <HoverRevealContainer gap={2}>
          <HoverRevealContainer.Item forceVisible flexGrow={1}>
            <Text textStyle="body2" noBottomMargin>
              {entity.info.type}
            </Text>
            <Text textStyle="body1">
              <a>{entity.info.name}</a>
            </Text>
          </HoverRevealContainer.Item>
          <HoverRevealContainer.Item forceVisible>
            <StatusTag status={entity.info.status} />
          </HoverRevealContainer.Item>
          <HoverRevealContainer.Item paddingTop={1}>
            <Delete onClick={handleDeleteClick} />
          </HoverRevealContainer.Item>
        </HoverRevealContainer>
      ) : (
        <Button>Select entity</Button>
      )}
    </>
  );
}
