import type { EntityReference } from '@dossierhq/core';
import { FullscreenContainer } from '@dossierhq/design';
import { useReducer, type ReactNode } from 'react';
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
  onOpenEntity: (entity: EntityReference) => void;
}

export function ChangelogScreen({
  header,
  footer,
  urlSearchParams,
  onUrlSearchParamsChange,
  onOpenEntity,
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
            onItemClick={onOpenEntity}
          />
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
      {/* <FullscreenContainer.Row padding={2} columnGap={2} flexDirection="row" alignItems="center">
        <SearchOrSampleEntitiesButtons
          {...{
            searchEntityState: changelogState,
            dispatchSearchEntityState: dispatchChangelogState,
          }}
        />
      </FullscreenContainer.Row> */}
      {footer ? <FullscreenContainer.Row fullWidth>{footer}</FullscreenContainer.Row> : null}
    </FullscreenContainer>
  );
}
