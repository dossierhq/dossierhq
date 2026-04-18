import type { Location } from '@dossierhq/core';

interface LocationState {
  value: Location | null;
  latString: string;
  lngString: string;
}

type LocationAction = UpdateValueAction | UpdateLatLngValueAction;

interface UpdateValueAction {
  type: 'value';
  value: Location | null;
}

interface UpdateLatLngValueAction {
  type: 'lat' | 'lng';
  value: string;
}

export function initializeLocationState(value: Location | null): LocationState {
  return {
    value,
    ...locationToStrings(value),
  };
}

export function reduceLocation(state: LocationState, action: LocationAction): LocationState {
  if (action.type === 'value') {
    return {
      ...state,
      value: action.value,
      ...locationToStrings(action.value),
    };
  }
  const newState = { ...state };
  if (action.type === 'lat') {
    newState.latString = action.value;
  } else {
    newState.lngString = action.value;
  }
  return newState;
}

function locationToStrings(location: Location | null) {
  return {
    latString: location ? String(location.lat) : '',
    lngString: location ? String(location.lng) : '',
  };
}

export function stringsToLocation({
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
