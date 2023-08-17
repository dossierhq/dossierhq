import { FullscreenContainer } from '@dossierhq/design';
import { useReducer, type ReactNode } from 'react';
import { ChangelogConnectionButtons } from '../../components/ChangelogConnectionButtons/ChangelogConnectionButtons.js';
import { ChangelogList } from '../../components/ChangelogList/ChangelogList.js';
import { useAdminLoadChangelog } from '../../hooks/useAdminLoadChangelog.js';
import { reduceChangelogState } from '../../reducers/ChangelogReducer/ChangelogReducer.js';
import {
  initializeChangelogStateFromUrlQuery,
  useSynchronizeUrlQueryAndChangelogState,
} from '../../reducers/ChangelogReducer/ChangelogUrlSynchronizer.js';

export interface ChangelogScreenProps {
  header?: ReactNode;
  footer?: ReactNode;
  urlSearchParams?: Readonly<URLSearchParams>;
  onUrlSearchParamsChange?: (urlSearchParams: Readonly<URLSearchParams>) => void;
}

export function ChangelogScreen({
  header,
  footer,
  urlSearchParams,
  onUrlSearchParamsChange,
}: ChangelogScreenProps): JSX.Element | null {
  const [changelogState, dispatchChangelogState] = useReducer(
    reduceChangelogState,
    urlSearchParams,
    initializeChangelogStateFromUrlQuery,
  );

  // sync url <-> search entity state
  useSynchronizeUrlQueryAndChangelogState(
    urlSearchParams,
    onUrlSearchParamsChange,
    changelogState,
    dispatchChangelogState,
  );

  // load collection/total
  useAdminLoadChangelog(changelogState, dispatchChangelogState);

  const isEmpty = changelogState.edges?.length === 0;

  return (
    <FullscreenContainer>
      {header ? <FullscreenContainer.Row fullWidth>{header}</FullscreenContainer.Row> : null}
      <FullscreenContainer.ScrollableRow
        scrollToTopSignal={changelogState.scrollToTopSignal}
        shadows="bottom"
      >
        <FullscreenContainer.Row height={isEmpty ? '100%' : undefined} paddingHorizontal={2}>
          <ChangelogList
            {...{
              changelogState,
              dispatchChangelogState,
            }}
          />
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
      <FullscreenContainer.Row padding={2} columnGap={2} flexDirection="row" alignItems="center">
        <ChangelogConnectionButtons {...{ changelogState, dispatchChangelogState }} />
      </FullscreenContainer.Row>
      {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
    </FullscreenContainer>
  );
}
