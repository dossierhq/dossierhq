import type { Entity, EntityReference, EntityTypeSpecification } from '@jonasb/datadata-core';
import { Field, FullscreenContainer, Text } from '@jonasb/datadata-design';
import React, { useContext, useEffect } from 'react';
import { PublishedDataDataContext, useEntity } from '../../index.js';

export interface EntityDetailScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  reference: EntityReference;
  onTitleChange?: (title: string) => void;
}

export function EntityDetailScreen({
  header,
  footer,
  reference,
  onTitleChange,
}: EntityDetailScreenProps): JSX.Element | null {
  const { publishedClient, schema } = useContext(PublishedDataDataContext);
  const { entity, entityError: _2 } = useEntity(publishedClient, reference);

  const typeSpec = schema && entity ? schema.getEntityTypeSpecification(entity.info.type) : null;

  useEffect(() => {
    if (entity && onTitleChange) onTitleChange(entity.info.name);
  }, [entity, onTitleChange]);

  return (
    <FullscreenContainer>
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.Row flexDirection="row" gap={2} paddingVertical={2}>
        {entity ? (
          <Text as="h1" textStyle="headline4">
            {entity.info.name}{' '}
            <Text as="span" textStyle="headline6">
              {entity.info.type}
            </Text>
          </Text>
        ) : null}
      </FullscreenContainer.Row>
      <FullscreenContainer.ScrollableRow>
        <FullscreenContainer.Row>
          {entity && typeSpec ? (
            <>
              <EntityMetadata entity={entity} />
              <EntityFields entity={entity} typeSpec={typeSpec} />
            </>
          ) : null}
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
      {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
    </FullscreenContainer>
  );
}

function EntityMetadata({ entity }: { entity: Entity }) {
  return (
    <Field>
      <Field.Label>ID</Field.Label>
      <Field.Control>{entity.id}</Field.Control>
    </Field>
  );
}

function EntityFields({
  entity,
  typeSpec,
}: {
  entity: Entity;
  typeSpec: EntityTypeSpecification;
}): JSX.Element {
  const fieldComponents = [];
  for (const fieldSpec of typeSpec.fields) {
    const { name } = fieldSpec;
    const fieldValue = entity.fields[name];
    if (fieldValue) {
      fieldComponents.push(
        <Field>
          <Field.Label>{name}</Field.Label>
          <Field.Control>{JSON.stringify(fieldValue)}</Field.Control>
        </Field>
      );
    }
  }
  return <>{fieldComponents}</>;
}
