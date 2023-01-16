import type { Location } from '@dossierhq/core';
import type { RefObject } from 'react';

interface State {
  onChangeRef: RefObject<(location: Location | null) => void>;
  value: Location | null;
  latString: string;
  lngString: string;
}

type Action = UpdateValueAction | UpdateLatLngValueAction;

interface UpdateValueAction {
  type: 'value';
  value: Location | null;
}

interface UpdateLatLngValueAction {
  type: 'lat' | 'lng';
  value: string;
}

function isUpdateValueAction(action: Action): action is UpdateValueAction {
  return action.type === 'value';
}

function isUpdateLatLngAction(action: Action): action is UpdateLatLngValueAction {
  return action.type === 'lat' || action.type === 'lng';
}

export function initializeLocationState({
  value,
  onChangeRef,
}: {
  value: Location | null;
  onChangeRef: RefObject<(location: Location | null) => void>;
}): State {
  return {
    onChangeRef,
    value,
    ...locationToStrings(value),
  };
}

export function reduceLocation(state: State, action: Action): State {
  if (isUpdateValueAction(action)) {
    return {
      ...state,
      value: action.value,
      ...locationToStrings(action.value),
    };
  }
  if (isUpdateLatLngAction(action)) {
    const newState = { ...state };
    if (action.type === 'lat') {
      newState.latString = action.value;
    } else {
      newState.lngString = action.value;
    }
    const location = stringsToLocation(newState);

    if (location) {
      if (!state.value || !(location.lat === state.value.lat && location.lng === state.value.lng)) {
        newState.onChangeRef.current?.(location);
      }
    }

    return newState;
  }
  return state;
}

function locationToStrings(location: Location | null) {
  return {
    latString: location ? String(location.lat) : '',
    lngString: location ? String(location.lng) : '',
  };
}

function stringsToLocation({
  latString,
  lngString,
}: {
  latString: string;
  lngString: string;
}): Location | null {
  const lat = Number.parseFloat(latString);
  const lng = Number.parseFloat(lngString);
  return !Number.isNaN(lat) && !Number.isNaN(lng) ? { lat, lng } : null;
}
