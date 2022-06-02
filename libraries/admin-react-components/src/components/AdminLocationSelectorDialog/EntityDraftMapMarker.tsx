import type { Location } from '@jonasb/datadata-core';
import { Column, Text } from '@jonasb/datadata-design';
import { MapContainer } from '@jonasb/datadata-leaflet';
import React from 'react';
import type { EntityEditorDraftState } from '../../reducers/EntityEditorReducer/EntityEditorReducer';

interface Props {
  draftState: EntityEditorDraftState;
  location: Location;
  onClick?: () => void;
}

export function EntityDraftMapMarker({ draftState, location, onClick }: Props) {
  if (!draftState.draft) return null;
  return (
    <MapContainer.Marker
      location={location}
      tooltip={
        <Column>
          <Text textStyle="subtitle1">{draftState.draft.name}</Text>
          <Text textStyle="body1">{draftState.draft.entitySpec.name}</Text>
        </Column>
      }
      onClick={onClick}
    />
  );
}
