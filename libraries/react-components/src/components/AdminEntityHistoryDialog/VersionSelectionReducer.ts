import type { EntityHistory } from '@dossierhq/core';

export interface VersionSelectionState {
  leftVersion: number | null;
  rightVersion: number | null;
  leftVersionItems: VersionItem[];
  rightVersionItems: VersionItem[];
}

export interface VersionItem {
  version: number;
  enabled: boolean;
}

interface VersionSelectionStateAction {
  reduce(state: Readonly<VersionSelectionState>): Readonly<VersionSelectionState>;
}

export function initializeVersionSelectionState(): VersionSelectionState {
  return {
    leftVersion: null,
    rightVersion: null,
    leftVersionItems: [],
    rightVersionItems: [],
  };
}

export function reduceVersionSelectionState(
  state: Readonly<VersionSelectionState>,
  action: VersionSelectionStateAction
): Readonly<VersionSelectionState> {
  const newState = action.reduce(state);
  // if (state !== newState) console.log(`State changed for ${action.constructor.name}`, state, action, newState);
  return newState;
}

// ACTIONS

class UpdateVersionHistoryAction implements VersionSelectionStateAction {
  value: EntityHistory;
  constructor(value: EntityHistory) {
    this.value = value;
  }

  reduce(state: Readonly<VersionSelectionState>): Readonly<VersionSelectionState> {
    let { leftVersion, rightVersion } = state;
    if (leftVersion === null) {
      leftVersion = this.value.versions.at(-1)?.version ?? null;
    }
    if (rightVersion === null) {
      const leftIndex = this.value.versions.findIndex((it) => it.version === leftVersion);
      rightVersion = leftIndex >= 0 ? this.value.versions[leftIndex - 1]?.version ?? null : null;
    }

    return {
      ...state,
      leftVersion,
      rightVersion,
      leftVersionItems: this.createItems(),
      rightVersionItems: this.createItems(),
    };
  }

  createItems(): VersionItem[] {
    return this.value.versions
      .map((it) => ({
        version: it.version,
        enabled: true, // TODO might not need separate items
      }))
      .reverse();
  }
}

class ChangeLeftVersionAction implements VersionSelectionStateAction {
  version: number;
  constructor(version: number) {
    this.version = version;
  }

  reduce(state: Readonly<VersionSelectionState>): Readonly<VersionSelectionState> {
    if (this.version === state.leftVersion) return state;

    return {
      ...state,
      leftVersion: this.version,
    };
  }
}

class ChangeRightVersionAction implements VersionSelectionStateAction {
  version: number;
  constructor(version: number) {
    this.version = version;
  }

  reduce(state: Readonly<VersionSelectionState>): Readonly<VersionSelectionState> {
    if (this.version === state.rightVersion) return state;

    return {
      ...state,
      rightVersion: this.version,
    };
  }
}

export const VersionSelectionAction = {
  UpdateVersionHistory: UpdateVersionHistoryAction,
  ChangeLeftVersion: ChangeLeftVersionAction,
  ChangeRightVersion: ChangeRightVersionAction,
};
