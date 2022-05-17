import type {
  BlockTool,
  BlockToolConstructable,
  BlockToolConstructorOptions,
  BlockToolData,
} from '@editorjs/editorjs';
import type { EntityReference, FieldSpecification, ItemValuePath } from '@jonasb/datadata-core';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import type { LegacyDataDataContextValue } from '../../contexts/LegacyDataDataContext';
import { LegacyDataDataContext } from '../../contexts/LegacyDataDataContext';
import icons from '../../icons';
import type { LegacyEntityEditorDraftState } from '../LegacyEntityEditor/LegacyEntityEditorReducer';
import { LegacyEntityItemFieldEditor } from '../LegacyEntityItemFieldEditor/LegacyEntityItemFieldEditor';

export interface EntityToolConfig {
  id: string;
  fieldSpec: FieldSpecification;
  draftState: LegacyEntityEditorDraftState;
  valuePath: ItemValuePath;
}

export function createEntityToolFactory(
  context: LegacyDataDataContextValue
): BlockToolConstructable {
  // since EditorJS (most likely) does a deep clone of config, provide context through dynamic sub class
  const factoryClass = class extends EntityTool {
    constructor(config: BlockToolConstructorOptions<EntityReference, EntityToolConfig>) {
      super(config, context);
    }
  };

  return factoryClass as unknown as BlockToolConstructable;
}

class EntityTool implements BlockTool {
  static get toolbox(): BlockToolConstructable['toolbox'] {
    return {
      title: 'Entity',
      icon: icons['entity-tool'],
    };
  }

  #config: EntityToolConfig;
  #data: EntityReference | null;
  #context: LegacyDataDataContextValue;

  constructor(
    { api: _, data, config }: BlockToolConstructorOptions<EntityReference, EntityToolConfig>,
    context: LegacyDataDataContextValue
  ) {
    if (!config) {
      throw new Error('Config is required');
    }
    this.#config = config;
    this.#data = Object.keys(data).length === 0 ? null : data;
    this.#context = context;
  }

  render(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'dd-py-1';
    ReactDOM.render(
      <Wrapper
        {...this.#config}
        context={this.#context}
        initialData={this.#data}
        onDataChange={(data) => (this.#data = data)}
      />,
      wrapper
    );
    return wrapper;
  }

  save(_block: HTMLInputElement): BlockToolData {
    return this.#data;
  }
}

function Wrapper({
  context,
  id,
  fieldSpec,
  draftState,
  valuePath,
  initialData,
  onDataChange,
}: {
  context: LegacyDataDataContextValue;
  id: string;
  fieldSpec: FieldSpecification;
  draftState: LegacyEntityEditorDraftState;
  valuePath: ItemValuePath;
  initialData: EntityReference | null;
  onDataChange: (data: EntityReference | null) => void;
}) {
  const [value, setValue] = useState(initialData);
  onDataChange(value);

  return (
    <LegacyDataDataContext.Provider value={context}>
      <LegacyEntityItemFieldEditor
        {...{ id, fieldSpec, draftState, valuePath }}
        value={value}
        onChange={setValue}
      />
    </LegacyDataDataContext.Provider>
  );
}
