import type { Entity, Location } from '@dossierhq/core';
import { MapContainer } from '@dossierhq/leaflet';
import { LocateFixedIcon } from 'lucide-react';
import { useCallback, useContext, useEffect, useReducer, useState, type ChangeEvent } from 'react';
import { ContentEditorDispatchContext } from '../contexts/ContentEditorDispatchContext.js';
import { useLoadContentList } from '../hooks/useLoadContentList.js';
import { useSchema } from '../hooks/useSchema.js';
import { ContentEditorActions } from '../reducers/ContentEditorReducer.js';
import {
  ContentListStateActions,
  initializeContentListState,
  reduceContentListState,
} from '../reducers/ContentListReducer.js';
import { ContentMap } from './ContentMap.js';
import { ContentMapMarker } from './ContentMapMarker.js';
import { Button } from './ui/button.js';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog.js';
import { Input } from './ui/input.js';
import { VisuallyHidden } from './ui/visually-hidden.js';

interface LocationState {
  latString: string;
  lngString: string;
}

type LocationAction =
  | { type: 'value'; value: Location | null }
  | { type: 'lat' | 'lng'; value: string };

function initializeLocationState(value: Location | null): LocationState {
  return locationToStrings(value);
}

function reduceLocation(state: LocationState, action: LocationAction): LocationState {
  if (action.type === 'value') {
    return locationToStrings(action.value);
  }
  if (action.type === 'lat') {
    return { ...state, latString: action.value };
  }
  return { ...state, lngString: action.value };
}

function locationToStrings(location: Location | null): LocationState {
  return {
    latString: location ? String(location.lat) : '',
    lngString: location ? String(location.lng) : '',
  };
}

function stringsToLocation({ latString, lngString }: LocationState): Location | null {
  const lat = Number.parseFloat(latString);
  const lng = Number.parseFloat(lngString);
  return !Number.isNaN(lat) && !Number.isNaN(lng) ? { lat, lng } : null;
}

export function LocationDialogContent({
  title,
  value,
  onChange,
}: {
  title: string;
  value: Location | null;
  onChange: (location: Location | null) => void;
}) {
  const { schema } = useSchema();
  const dispatchContentEditor = useContext(ContentEditorDispatchContext);

  const [{ latString, lngString }, dispatch] = useReducer(
    reduceLocation,
    value,
    initializeLocationState,
  );
  useEffect(() => {
    dispatch({ type: 'value', value });
  }, [value]);

  const emitIfChanged = useCallback(
    (nextLatString: string, nextLngString: string) => {
      const location = stringsToLocation({ latString: nextLatString, lngString: nextLngString });
      if (location && (!value || location.lat !== value.lat || location.lng !== value.lng)) {
        onChange(location);
      }
    },
    [value, onChange],
  );

  const handleLatChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextLat = event.currentTarget.value;
      dispatch({ type: 'lat', value: nextLat });
      emitIfChanged(nextLat, lngString);
    },
    [emitIfChanged, lngString],
  );

  const handleLngChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextLng = event.currentTarget.value;
      dispatch({ type: 'lng', value: nextLng });
      emitIfChanged(latString, nextLng);
    },
    [emitIfChanged, latString],
  );

  const [resetSignal, setResetSignal] = useState(0);
  const handleResetClick = useCallback(() => setResetSignal((it) => it + 1), []);

  const [contentListState, dispatchContentList] = useReducer(
    reduceContentListState,
    {
      mode: 'full' as const,
      actions: [new ContentListStateActions.SetSampling({ count: 100 }, false)],
    },
    initializeContentListState,
  );
  useLoadContentList(contentListState, dispatchContentList);

  //TODO show markers for locations in other open drafts, like the legacy AdminLocationSelectorDialog

  return (
    <DialogContent className="grid-rows-[auto_auto_1fr]" size="maximize">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <VisuallyHidden asChild>
        <DialogDescription>
          Select a location by clicking on the map or entering coordinates.
        </DialogDescription>
      </VisuallyHidden>
      <div className="flex justify-center gap-2">
        <Input
          value={latString}
          onChange={handleLatChange}
          type="number"
          min={-90.0}
          max={90.0}
          step={0.000001}
          aria-label="Latitude"
        />
        <Input
          value={lngString}
          onChange={handleLngChange}
          type="number"
          min={-180.0}
          max={180.0}
          step={0.000001}
          aria-label="Longitude"
        />
        <Button
          variant="outline"
          size="icon"
          disabled={!value}
          aria-label="Center on location"
          onClick={handleResetClick}
        >
          <LocateFixedIcon />
        </Button>
      </div>
      <div className="-m-6 mt-0 overflow-hidden rounded-b-lg">
        <ContentMap<Entity>
          className="h-full"
          schema={schema}
          center={value}
          resetSignal={resetSignal}
          contentListState={contentListState}
          dispatchContentList={dispatchContentList}
          renderEntityMarker={(key, entity, location) => (
            <ContentMapMarker
              key={key}
              entity={entity}
              location={location}
              onClick={() =>
                dispatchContentEditor(new ContentEditorActions.AddDraft({ id: entity.id }))
              }
            />
          )}
        >
          <MapContainer.EditLocationMarker value={value} onChange={onChange} />
        </ContentMap>
      </div>
    </DialogContent>
  );
}

export function LocationDisplayDialogContent({ title, value }: { title: string; value: Location }) {
  return (
    <DialogContent className="grid-rows-[auto_1fr]" size="maximize">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <VisuallyHidden asChild>
        <DialogDescription>Shows the location on a map.</DialogDescription>
      </VisuallyHidden>
      <div className="-m-6 mt-0 overflow-hidden rounded-b-lg">
        <MapContainer className="chromatic-ignore h-full" center={value}>
          <MapContainer.Marker location={value} />
        </MapContainer>
      </div>
    </DialogContent>
  );
}
