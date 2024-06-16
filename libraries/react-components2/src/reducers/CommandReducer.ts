export interface CommandMenuState<TPage, TAlert> {
  pages: TPage[];
  defaultPage: TPage;
  currentPage: TPage | null;
  search: string; //TODO one per page
  alert: TAlert | null;
}

export interface CommandMenuAction<TPage, TAlert> {
  reduce(
    state: Readonly<CommandMenuState<TPage, TAlert>>,
  ): Readonly<CommandMenuState<TPage, TAlert>>;
}

export function initializeCommandMenuState<TPage, TAlert>(
  defaultPage: TPage,
): CommandMenuState<TPage, TAlert> {
  return {
    pages: [],
    currentPage: null,
    defaultPage,
    search: '',
    alert: null,
  };
}

export function reduceCommandMenuState<TPage, TAlert>(
  state: Readonly<CommandMenuState<TPage, TAlert>>,
  action: CommandMenuAction<TPage, TAlert>,
): Readonly<CommandMenuState<TPage, TAlert>> {
  const newState = action.reduce(state);
  // if (state !== newState) console.log(`State changed for ${action.constructor.name}`, state, action, newState);
  return newState;
}

export class CommandMenuState_ShowAction<TPage, TAlert>
  implements CommandMenuAction<TPage, TAlert>
{
  pages: TPage[];

  constructor(pages?: TPage[]) {
    this.pages = pages || [];
  }

  reduce(
    state: Readonly<CommandMenuState<TPage, TAlert>>,
  ): Readonly<CommandMenuState<TPage, TAlert>> {
    const pages = this.pages.length > 0 ? this.pages : [state.defaultPage];
    return { ...state, pages, currentPage: pages[0] };
  }
}

export class CommandMenuState_ToggleShowAction<TPage, TAlert>
  implements CommandMenuAction<TPage, TAlert>
{
  show: boolean | undefined;

  constructor(show?: boolean) {
    this.show = show;
  }

  reduce(
    state: Readonly<CommandMenuState<TPage, TAlert>>,
  ): Readonly<CommandMenuState<TPage, TAlert>> {
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

export class CommandMenuState_OpenPageAction<TPage, TAlert>
  implements CommandMenuAction<TPage, TAlert>
{
  page: TPage;

  constructor(page: TPage) {
    this.page = page;
  }

  reduce(
    state: Readonly<CommandMenuState<TPage, TAlert>>,
  ): Readonly<CommandMenuState<TPage, TAlert>> {
    return {
      ...state,
      pages: [...state.pages, this.page],
      currentPage: this.page,
      search: '',
    };
  }
}

export class CommandMenuState_CloseAction<TPage, TAlert>
  implements CommandMenuAction<TPage, TAlert>
{
  reduce(
    state: Readonly<CommandMenuState<TPage, TAlert>>,
  ): Readonly<CommandMenuState<TPage, TAlert>> {
    return { ...state, pages: [], currentPage: null };
  }
}

export class CommandMenuState_CloseAlertAction<TPage, TAlert>
  implements CommandMenuAction<TPage, TAlert>
{
  reduce(
    state: Readonly<CommandMenuState<TPage, TAlert>>,
  ): Readonly<CommandMenuState<TPage, TAlert>> {
    return { ...state, alert: null };
  }
}

export class CommandMenuState_ClosePageAction<TPage, TAlert>
  implements CommandMenuAction<TPage, TAlert>
{
  reduce(
    state: Readonly<CommandMenuState<TPage, TAlert>>,
  ): Readonly<CommandMenuState<TPage, TAlert>> {
    const pages = state.pages.slice(0, -1);
    return { ...state, pages, currentPage: pages[pages.length - 1] };
  }
}

export class CommandMenuState_ShowAlertAction<TPage, TAlert>
  implements CommandMenuAction<TPage, TAlert>
{
  alert: TAlert;

  constructor(alert: TAlert) {
    this.alert = alert;
  }

  reduce(
    state: Readonly<CommandMenuState<TPage, TAlert>>,
  ): Readonly<CommandMenuState<TPage, TAlert>> {
    return { ...state, alert: this.alert };
  }
}

export class CommandMenuState_UpdateSearchAction<TPage, TAlert>
  implements CommandMenuAction<TPage, TAlert>
{
  search: string;

  constructor(search: string) {
    this.search = search;
  }

  reduce(
    state: Readonly<CommandMenuState<TPage, TAlert>>,
  ): Readonly<CommandMenuState<TPage, TAlert>> {
    return { ...state, search: this.search };
  }
}
