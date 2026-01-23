export interface CommandMenuConfig<TPage, TAlert> {
  page: TPage;
  alert: TAlert;
}

export interface CommandMenuState<TConfig extends CommandMenuConfig<unknown, unknown>> {
  pages: TConfig['page'][];
  defaultPage: TConfig['page'];
  currentPage: TConfig['page'] | null;
  search: string; //TODO one per page
  alert: TConfig['alert'] | null;
}

export interface CommandMenuAction<TConfig extends CommandMenuConfig<unknown, unknown>> {
  reduce(state: Readonly<CommandMenuState<TConfig>>): Readonly<CommandMenuState<TConfig>>;
}

export function initializeCommandMenuState<TConfig extends CommandMenuConfig<unknown, unknown>>(
  defaultPage: TConfig['page'],
): CommandMenuState<TConfig> {
  return {
    pages: [],
    currentPage: null,
    defaultPage,
    search: '',
    alert: null,
  };
}

export function reduceCommandMenuState<TConfig extends CommandMenuConfig<unknown, unknown>>(
  state: Readonly<CommandMenuState<TConfig>>,
  action: CommandMenuAction<TConfig>,
): Readonly<CommandMenuState<TConfig>> {
  const newState = action.reduce(state);
  // if (state !== newState) console.log(`State changed for ${action.constructor.name}`, state, action, newState);
  return newState;
}

export class CommandMenuState_ShowAction<
  TConfig extends CommandMenuConfig<unknown, unknown>,
> implements CommandMenuAction<TConfig> {
  pages: TConfig['page'][];

  constructor(pages?: TConfig['page'][]) {
    this.pages = pages || [];
  }

  reduce(state: Readonly<CommandMenuState<TConfig>>): Readonly<CommandMenuState<TConfig>> {
    const pages = this.pages.length > 0 ? this.pages : [state.defaultPage];
    return { ...state, pages, currentPage: pages[0] };
  }
}

export class CommandMenuState_ToggleShowAction<
  TConfig extends CommandMenuConfig<unknown, unknown>,
> implements CommandMenuAction<TConfig> {
  show: boolean | undefined;

  constructor(show?: boolean) {
    this.show = show;
  }

  reduce(state: Readonly<CommandMenuState<TConfig>>): Readonly<CommandMenuState<TConfig>> {
    if (this.show === true) {
      if (state.currentPage) {
        return state;
      }
      return {
        ...state,
        pages: [state.defaultPage],
        currentPage: state.defaultPage,
      };
    }
    if (this.show === false) {
      if (!state.currentPage) {
        return state;
      }
      return { ...state, pages: [], currentPage: null };
    }

    if (state.pages.length === 0) {
      return {
        ...state,
        pages: [state.defaultPage],
        currentPage: state.defaultPage,
      };
    }
    return { ...state, pages: [], currentPage: null };
  }
}

export class CommandMenuState_OpenPageAction<
  TConfig extends CommandMenuConfig<unknown, unknown>,
> implements CommandMenuAction<TConfig> {
  page: TConfig['page'];

  constructor(page: TConfig['page']) {
    this.page = page;
  }

  reduce(state: Readonly<CommandMenuState<TConfig>>): Readonly<CommandMenuState<TConfig>> {
    return {
      ...state,
      pages: [...state.pages, this.page],
      currentPage: this.page,
      search: '',
    };
  }
}

export class CommandMenuState_CloseAction<
  TConfig extends CommandMenuConfig<unknown, unknown>,
> implements CommandMenuAction<TConfig> {
  reduce(state: Readonly<CommandMenuState<TConfig>>): Readonly<CommandMenuState<TConfig>> {
    return { ...state, pages: [], currentPage: null };
  }
}

export class CommandMenuState_CloseAlertAction<
  TConfig extends CommandMenuConfig<unknown, unknown>,
> implements CommandMenuAction<TConfig> {
  reduce(state: Readonly<CommandMenuState<TConfig>>): Readonly<CommandMenuState<TConfig>> {
    return { ...state, alert: null };
  }
}

export class CommandMenuState_ClosePageAction<
  TConfig extends CommandMenuConfig<unknown, unknown>,
> implements CommandMenuAction<TConfig> {
  reduce(state: Readonly<CommandMenuState<TConfig>>): Readonly<CommandMenuState<TConfig>> {
    const pages = state.pages.slice(0, -1);
    return { ...state, pages, currentPage: pages[pages.length - 1] };
  }
}

export class CommandMenuState_ShowAlertAction<
  TConfig extends CommandMenuConfig<unknown, unknown>,
> implements CommandMenuAction<TConfig> {
  alert: TConfig['alert'];

  constructor(alert: TConfig['alert']) {
    this.alert = alert;
  }

  reduce(state: Readonly<CommandMenuState<TConfig>>): Readonly<CommandMenuState<TConfig>> {
    return { ...state, alert: this.alert };
  }
}

export class CommandMenuState_UpdateSearchAction<
  TConfig extends CommandMenuConfig<unknown, unknown>,
> implements CommandMenuAction<TConfig> {
  search: string;

  constructor(search: string) {
    this.search = search;
  }

  reduce(state: Readonly<CommandMenuState<TConfig>>): Readonly<CommandMenuState<TConfig>> {
    return { ...state, search: this.search };
  }
}
