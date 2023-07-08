import type { RichText } from '@dossierhq/core';
import isEqual from 'lodash/isEqual.js';

interface RichTextState {
  initialized: boolean;
  data: RichText | null;
  dataSetFromEditor: boolean;
}

interface RichTextAction {
  reduce(state: Readonly<RichTextState>): Readonly<RichTextState>;
}

export function initializeRichTextState({ data }: { data: RichText | null }): RichTextState {
  return { initialized: false, data, dataSetFromEditor: false };
}

export function reduceRichTextState(
  state: Readonly<RichTextState>,
  action: RichTextAction,
): Readonly<RichTextState> {
  const newState = action.reduce(state);
  // if (newState !== state) {
  //   console.log(`State changed for ${action.constructor.name}`, state, action, newState);
  // }
  return newState;
}

class SetInitializedAction implements RichTextAction {
  reduce(state: Readonly<RichTextState>): Readonly<RichTextState> {
    return { ...state, initialized: true };
  }
}

class SetDataAction implements RichTextAction {
  data: RichText | null;
  dataSetFromEditor: boolean;

  constructor(data: RichText | null, dataSetFromEditor: boolean) {
    this.data = data;
    this.dataSetFromEditor = dataSetFromEditor;
  }

  reduce(state: Readonly<RichTextState>): Readonly<RichTextState> {
    if (isEqual(state.data, this.data)) {
      return state;
    }
    return { ...state, data: this.data, dataSetFromEditor: this.dataSetFromEditor };
  }
}

export const RichTextActions = {
  SetInitialized: SetInitializedAction,
  SetData: SetDataAction,
};
