import type { RichText } from '@jonasb/datadata-core';

interface RichTextState {
  initialized: boolean;
  data: RichText | null;
  dataSetFromEditor: boolean;
}

interface RichTextAction {
  reduce(state: RichTextState): RichTextState;
}

export function initializeRichTextState({ data }: { data: RichText | null }): RichTextState {
  return { initialized: false, data, dataSetFromEditor: false };
}

export function reduceRichTextState(state: RichTextState, action: RichTextAction): RichTextState {
  return action.reduce(state);
}

export class SetInitializedAction implements RichTextAction {
  reduce(state: RichTextState): RichTextState {
    return { ...state, initialized: true };
  }
}

export class SetDataAction implements RichTextAction {
  #data: RichText | null;
  #dataSetFromEditor: boolean;

  constructor(data: RichText | null, dataSetFromEditor: boolean) {
    this.#data = data;
    this.#dataSetFromEditor = dataSetFromEditor;
  }

  reduce(state: RichTextState): RichTextState {
    return { ...state, data: this.#data, dataSetFromEditor: this.#dataSetFromEditor };
  }
}
