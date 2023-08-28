import type { ChangelogEvent, Connection, Edge, EntityReference, ErrorType } from '@dossierhq/core';

export interface VersionSelectionState {
  entity: EntityReference;
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

export function initializeVersionSelectionState(entity: EntityReference): VersionSelectionState {
  return {
    entity,
    leftVersion: null,
    rightVersion: null,
    leftVersionItems: [],
    rightVersionItems: [],
  };
}

export function reduceVersionSelectionState(
  state: Readonly<VersionSelectionState>,
  action: VersionSelectionStateAction,
): Readonly<VersionSelectionState> {
  const newState = action.reduce(state);
  // if (state !== newState) console.log(`State changed for ${action.constructor.name}`, state, action, newState);
  return newState;
}

// ACTIONS

class UpdateVersionHistoryAction implements VersionSelectionStateAction {
  value: Connection<Edge<ChangelogEvent, typeof ErrorType.Generic>>;
  constructor(value: Connection<Edge<ChangelogEvent, typeof ErrorType.Generic>>) {
    this.value = value;
  }

  reduce(state: Readonly<VersionSelectionState>): Readonly<VersionSelectionState> {
    const versions = new Set<number>();
    for (const edge of this.value.edges) {
      if (edge.node.isError()) continue;
      const event = edge.node.value;

      const entityInfo =
        'entities' in event ? event.entities.find((it) => it.id === state.entity.id) : null;
      if (!entityInfo) continue;
      versions.add(entityInfo.version);
    }

    const sortedVersions = Array.from(versions).sort((a, b) => b - a); // descending

    let { leftVersion, rightVersion } = state;
    if (leftVersion === null) {
      leftVersion = sortedVersions[0] ?? null;
    }
    if (rightVersion === null) {
      rightVersion = sortedVersions[1] ?? null;
    }

    const versionItems = this.createItems(sortedVersions);

    return {
      ...state,
      leftVersion,
      rightVersion,
      leftVersionItems: versionItems,
      rightVersionItems: versionItems,
    };
  }

  createItems(versions: number[]): VersionItem[] {
    return versions.map((it) => ({
      version: it,
      enabled: true,
    }));
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
