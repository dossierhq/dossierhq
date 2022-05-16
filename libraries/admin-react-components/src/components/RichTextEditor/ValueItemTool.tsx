import type {
  BlockTool,
  BlockToolConstructable,
  BlockToolConstructorOptions,
  BlockToolData,
} from '@editorjs/editorjs';
import type { FieldSpecification, ValueItem } from '@jonasb/datadata-core';
import type { Dispatch } from 'react';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import type { AdminDataDataContextValue } from '../../contexts/AdminDataDataContext';
import { AdminDataDataContext } from '../../contexts/AdminDataDataContext';
import { EntityEditorDispatchContext } from '../../contexts/EntityEditorDispatchContext';
import icons from '../../icons';
import type { EntityEditorStateAction } from '../../reducers/EntityEditorReducer/EntityEditorReducer';
import { ValueTypeFieldEditor } from '../EntityEditor/ValueTypeFieldEditor';

export interface ValueItemToolConfig {
  fieldSpec: FieldSpecification;
}

export function createValueItemToolFactory(
  adminDataDataContext: AdminDataDataContextValue,
  entityEditorDispatchContext: Dispatch<EntityEditorStateAction>
): BlockToolConstructable {
  // since EditorJS (most likely) does a deep clone of config, provide context through dynamic sub class
  const factoryClass = class extends ValueItemTool {
    constructor(config: BlockToolConstructorOptions<ValueItem, ValueItemToolConfig>) {
      super(config, adminDataDataContext, entityEditorDispatchContext);
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
  adminDataDataContext: AdminDataDataContextValue;
  entityEditorDispatchContext: Dispatch<EntityEditorStateAction>;

  constructor(
    { api: _, data, config }: BlockToolConstructorOptions<ValueItem, ValueItemToolConfig>,
    adminDataDataContext: AdminDataDataContextValue,
    entityEditorDispatchContext: Dispatch<EntityEditorStateAction>
  ) {
    if (!config) {
      throw new Error('Config is required');
    }
    this.#config = config;
    this.#data = Object.keys(data).length === 0 ? null : data;
    this.adminDataDataContext = adminDataDataContext;
    this.entityEditorDispatchContext = entityEditorDispatchContext;
  }

  render(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'dd-py-1';
    ReactDOM.render(
      <Wrapper
        {...this.#config}
        adminDataDataContext={this.adminDataDataContext}
        entityEditorDispatchContext={this.entityEditorDispatchContext}
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
  adminDataDataContext,
  entityEditorDispatchContext,
  fieldSpec,
  initialData,
  onDataChange,
}: {
  adminDataDataContext: AdminDataDataContextValue;
  entityEditorDispatchContext: Dispatch<EntityEditorStateAction>;
  fieldSpec: FieldSpecification;
  initialData: ValueItem | null;
  onDataChange: (data: ValueItem | null) => void;
}) {
  const [value, setValue] = useState(initialData);
  onDataChange(value);

  return (
    <AdminDataDataContext.Provider value={adminDataDataContext}>
      <EntityEditorDispatchContext.Provider value={entityEditorDispatchContext}>
        <ValueTypeFieldEditor fieldSpec={fieldSpec} value={value} onChange={setValue} />
      </EntityEditorDispatchContext.Provider>
    </AdminDataDataContext.Provider>
  );
}
