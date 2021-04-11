import type { EntityReference, FieldSpecification } from '@datadata/core';
import type {
  BlockTool,
  BlockToolConstructable,
  BlockToolConstructorOptions,
  BlockToolData,
} from '@editorjs/editorjs';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import type { DataDataContextValue } from '../..';
import { DataDataContext, EntityItemFieldEditor } from '../..';
import icons from '../../icons';

export interface EntityToolConfig {
  id: string;
  fieldSpec: FieldSpecification;
}

export function createEntityToolFactory(context: DataDataContextValue): BlockToolConstructable {
  // since EditorJS (most likely) does a deep clone of config, provide context through dynamic sub class
  const factoryClass = class extends EntityTool {
    constructor(config: BlockToolConstructorOptions<EntityReference, EntityToolConfig>) {
      super(config, context);
    }
  };

  return (factoryClass as unknown) as BlockToolConstructable;
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
  #context: DataDataContextValue;

  constructor(
    { api: _, data, config }: BlockToolConstructorOptions<EntityReference, EntityToolConfig>,
    context: DataDataContextValue
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
    wrapper.className = 'dd py-1';
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
  initialData,
  onDataChange,
}: {
  context: DataDataContextValue;
  id: string;
  fieldSpec: FieldSpecification;
  initialData: EntityReference | null;
  onDataChange: (data: EntityReference | null) => void;
}) {
  const [value, setValue] = useState(initialData);
  onDataChange(value);

  return (
    <DataDataContext.Provider value={context}>
      <EntityItemFieldEditor
        {...{ id, fieldSpec, schema: context.schema }}
        value={value}
        onChange={setValue}
      />
    </DataDataContext.Provider>
  );
}
