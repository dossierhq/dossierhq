import type { FieldSpecification, ValueItem } from '@datadata/core';
import type {
  BlockTool,
  BlockToolConstructable,
  BlockToolConstructorOptions,
  BlockToolData,
} from '@editorjs/editorjs';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import type { DataDataContextValue } from '../..';
import { DataDataContext, ValueTypeFieldEditor } from '../..';
import icons from '../../icons';

export interface ValueItemToolConfig {
  id: string;
  fieldSpec: FieldSpecification;
}

export function createValueItemToolFactory(context: DataDataContextValue): BlockToolConstructable {
  // since EditorJS (most likely) does a deep clone of config, provide context through dynamic sub class
  const factoryClass = class extends ValueItemTool {
    constructor(config: BlockToolConstructorOptions<ValueItem, ValueItemToolConfig>) {
      super(config, context);
    }
  };

  return factoryClass as unknown as BlockToolConstructable;
}

class ValueItemTool implements BlockTool {
  static get toolbox(): BlockToolConstructable['toolbox'] {
    return {
      title: 'Value item',
      icon: icons['value-item-tool'],
    };
  }

  #config: ValueItemToolConfig;
  #data: ValueItem | null;
  #context: DataDataContextValue;

  constructor(
    { api: _, data, config }: BlockToolConstructorOptions<ValueItem, ValueItemToolConfig>,
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
  initialData: ValueItem | null;
  onDataChange: (data: ValueItem | null) => void;
}) {
  const [value, setValue] = useState(initialData);
  onDataChange(value);

  return (
    <DataDataContext.Provider value={context}>
      <ValueTypeFieldEditor
        {...{ id, fieldSpec, schema: context.schema }}
        value={value}
        onChange={setValue}
      />
    </DataDataContext.Provider>
  );
}
