export interface CommandMenuState<TPage> {
  pages: TPage[];
  defaultPage: TPage;
  currentPage: TPage | null;
  search: string;
}

export interface CommandMenuAction<TPage> {
  reduce(state: Readonly<CommandMenuState<TPage>>): Readonly<CommandMenuState<TPage>>;
}

export function initializeCommandMenuState<TPage>(defaultPage: TPage): CommandMenuState<TPage> {
  return {
    pages: [],
    currentPage: null,
    defaultPage,
    search: '',
  };
}

export function reduceCommandMenuState<TPage>(
  state: Readonly<CommandMenuState<TPage>>,
  action: CommandMenuAction<TPage>,
): Readonly<CommandMenuState<TPage>> {
  const newState = action.reduce(state);
  // if (state !== newState) console.log(`State changed for ${action.constructor.name}`, state, action, newState);
  return newState;
}

export class CommandMenuState_ShowAction<TPage> implements CommandMenuAction<TPage> {
  pages: TPage[];

  constructor(pages?: TPage[]) {
    this.pages = pages || [];
  }

  reduce(state: Readonly<CommandMenuState<TPage>>): Readonly<CommandMenuState<TPage>> {
    const pages = this.pages.length > 0 ? this.pages : [state.defaultPage];
    return { ...state, pages, currentPage: pages[0] };
  }
}

export class CommandMenuState_ToggleShowAction<TPage> implements CommandMenuAction<TPage> {
  show: boolean | undefined;

  constructor(show?: boolean) {
    this.show = show;
  }

  reduce(state: Readonly<CommandMenuState<TPage>>): Readonly<CommandMenuState<TPage>> {
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

export class CommandMenuState_OpenPageAction<TPage> implements CommandMenuAction<TPage> {
  page: TPage;

  constructor(page: TPage) {
    this.page = page;
  }

  reduce(state: Readonly<CommandMenuState<TPage>>): Readonly<CommandMenuState<TPage>> {
    return {
      ...state,
      pages: [...state.pages, this.page],
      currentPage: this.page,
    };
  }
}

export class CommandMenuState_CloseAction<TPage> implements CommandMenuAction<TPage> {
  reduce(state: Readonly<CommandMenuState<TPage>>): Readonly<CommandMenuState<TPage>> {
    return { ...state, pages: [], currentPage: null };
  }
}

export class CommandMenuState_ClosePageAction<TPage> implements CommandMenuAction<TPage> {
  reduce(state: Readonly<CommandMenuState<TPage>>): Readonly<CommandMenuState<TPage>> {
    const pages = state.pages.slice(0, -1);
    return { ...state, pages, currentPage: pages[pages.length - 1] };
  }
}

export class CommandMenuState_UpdateSearchAction<TPage> implements CommandMenuAction<TPage> {
  search: string;

  constructor(search: string) {
    this.search = search;
  }

  reduce(state: Readonly<CommandMenuState<TPage>>): Readonly<CommandMenuState<TPage>> {
    return { ...state, search: this.search };
  }
}
