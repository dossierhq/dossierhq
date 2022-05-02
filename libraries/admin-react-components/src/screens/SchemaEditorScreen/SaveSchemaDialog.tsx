import type { AdminSchemaSpecificationUpdate } from '@jonasb/datadata-core';
import { Card, Dialog, NotificationContext, Text, TextArea } from '@jonasb/datadata-design';
import type { Dispatch } from 'react';
import React, { useCallback, useContext, useMemo } from 'react';
import { AdminDataDataContext } from '../..';
import type {
  SchemaEditorState,
  SchemaEditorStateAction,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';
import {
  getSchemaSpecificationUpdateFromEditorState,
  SchemaEditorActions,
} from '../../reducers/SchemaEditorReducer/SchemaEditorReducer';

export function SaveSchemaDialog({
  show,
  schemaEditorState,
  dispatchSchemaEditorState,
  onClose,
}: {
  show: boolean;
  schemaEditorState: SchemaEditorState;
  dispatchSchemaEditorState: Dispatch<SchemaEditorStateAction>;
  onClose: () => void;
}) {
  const { adminClient } = useContext(AdminDataDataContext);
  const { showNotification } = useContext(NotificationContext);

  const schemaSpecUpdate = useMemo(
    () => (show ? getSchemaSpecificationUpdateFromEditorState(schemaEditorState) : null),
    [schemaEditorState, show]
  );

  const handleClose = useCallback(
    async (event: Event, returnValue: string) => {
      if (returnValue === 'save' && schemaSpecUpdate) {
        dispatchSchemaEditorState(
          new SchemaEditorActions.SetNextUpdateSchemaSpecificationIsDueToSave(true)
        );

        const result = await adminClient.updateSchemaSpecification(schemaSpecUpdate);
        if (result.isOk()) {
          showNotification({ color: 'success', message: 'Updated schema.' });
        } else {
          showNotification({ color: 'error', message: 'Failed saving schema.' });
          dispatchSchemaEditorState(
            new SchemaEditorActions.SetNextUpdateSchemaSpecificationIsDueToSave(false)
          );
        }
      }
      onClose();
    },
    [adminClient, dispatchSchemaEditorState, onClose, schemaSpecUpdate, showNotification]
  );

  return (
    <Dialog show={show} modal onClose={handleClose}>
      {show && schemaSpecUpdate ? (
        <SaveSchemaDialogContent schemaSpecUpdate={schemaSpecUpdate} />
      ) : null}
    </Dialog>
  );
}

function SaveSchemaDialogContent({
  schemaSpecUpdate,
}: {
  schemaSpecUpdate: AdminSchemaSpecificationUpdate;
}) {
  return (
    <Card>
      <Card.Header>
        <Card.HeaderTitle>Save schema</Card.HeaderTitle>
      </Card.Header>
      <Card.Content>
        <Text textStyle="body1">Do you want to save the following changes?</Text>
        <TextArea
          fixedSize
          textStyle="code2"
          readOnly
          style={{ minHeight: '300px' }}
          defaultValue={JSON.stringify(schemaSpecUpdate, null, 2)}
        />
      </Card.Content>
      <Card.Footer>
        <Card.FooterButton>Cancel</Card.FooterButton>
        <Card.FooterButton value="save">Save</Card.FooterButton>
      </Card.Footer>
    </Card>
  );
}
