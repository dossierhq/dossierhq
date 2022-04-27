import type { Location } from '@jonasb/datadata-core';

interface State {
  onChange: ((location: Location | null) => void) | undefined;
  value: Location | null;
  latString: string;
  lngString: string;
}

type Action = UpdateValueAction | UpdateOnChangeAction | UpdateLatLngValueAction;

interface UpdateValueAction {
  type: 'value';
  value: Location | null;
}

interface UpdateOnChangeAction {
  type: 'onChange';
  onChange: ((location: Location | null) => void) | undefined;
}

interface UpdateLatLngValueAction {
  type: 'lat' | 'lng';
  value: string;
}

function isUpdateValueAction(action: Action): action is UpdateValueAction {
  return action.type === 'value';
}

function isUpdateOnChangeAction(action: Action): action is UpdateOnChangeAction {
  return action.type === 'onChange';
}

function isUpdateLatLngAction(action: Action): action is UpdateLatLngValueAction {
  return action.type === 'lat' || action.type === 'lng';
}

export function initializeLocationState({
  value,
  onChange,
}: {
  value: Location | null;
  onChange: ((location: Location | null) => void) | undefined;
}): State {
  return {
    onChange,
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
  if (isUpdateOnChangeAction(action)) {
    return { ...state, onChange: action.onChange };
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
        newState.onChange?.(location);
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
