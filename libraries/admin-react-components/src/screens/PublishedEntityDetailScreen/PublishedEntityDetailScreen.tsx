import type {
  EntityReference,
  PublishedEntity,
  PublishedEntityTypeSpecification,
} from '@jonasb/datadata-core';
import { Field, FullscreenContainer, Text } from '@jonasb/datadata-design';
import React, { useContext, useEffect } from 'react';
import { PublishedDataDataContext, usePublishedEntity } from '../../published';

export interface PublishedEntityDetailScreenProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  reference: EntityReference;
  onTitleChange?: (title: string) => void;
}

export function PublishedEntityDetailScreen({
  header,
  footer,
  reference,
  onTitleChange,
}: PublishedEntityDetailScreenProps): JSX.Element | null {
  const { publishedClient, schema } = useContext(PublishedDataDataContext);
  const { entity, entityError: _2 } = usePublishedEntity(publishedClient, reference);

  const typeSpec = schema && entity ? schema.getEntityTypeSpecification(entity.info.type) : null;

  useEffect(() => {
    if (entity && onTitleChange) onTitleChange(entity.info.name);
  }, [entity, onTitleChange]);

  return (
    <FullscreenContainer>
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.Row flexDirection="row">
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
        <FullscreenContainer.Row paddingVertical={2}>
          {entity && typeSpec ? (
            <>
              <EntityFields entity={entity} typeSpec={typeSpec} />
            </>
          ) : null}
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
      {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
    </FullscreenContainer>
  );
}

function EntityFields({
  entity,
  typeSpec,
}: {
  entity: PublishedEntity;
  typeSpec: PublishedEntityTypeSpecification;
}): JSX.Element {
  const fieldComponents = [];
  for (const fieldSpec of typeSpec.fields) {
    const { name } = fieldSpec;
    const fieldValue = entity.fields[name];
    if (fieldValue) {
      fieldComponents.push(
        <Field key={name}>
          <Field.Label>{name}</Field.Label>
          <Field.Control>{JSON.stringify(fieldValue)}</Field.Control>
        </Field>
      );
    }
  }
  return <>{fieldComponents}</>;
}
