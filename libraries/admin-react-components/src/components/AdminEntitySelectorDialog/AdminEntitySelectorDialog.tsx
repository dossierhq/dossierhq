import type { AdminEntity, AdminQuery, AdminSearchQuery } from '@jonasb/datadata-core';
import { Dialog, FullscreenContainer, IconButton, Text } from '@jonasb/datadata-design';
import React, { useReducer } from 'react';
import { useAdminLoadSampleEntities } from '../../hooks/useAdminLoadSampleEntities';
import { useAdminLoadSearchEntitiesAndTotalCount } from '../../hooks/useAdminLoadSearchEntitiesAndTotalCount';
import {
  initializeSearchEntityState,
  reduceSearchEntityState,
  SearchOrSampleEntitiesButtons,
} from '../../shared';
import { AdminEntityList } from '../AdminEntityList/AdminEntityList';

interface AdminEntitySelectorDialogProps {
  show: boolean;
  title: string;
  onClose: () => void;
  onItemClick: (item: AdminEntity) => void;
}

export function AdminEntitySelectorDialog({
  show,
  title,
  onClose,
  onItemClick,
}: AdminEntitySelectorDialogProps) {
  return (
    <Dialog show={show} modal onClose={onClose} width="wide" height="fill">
      <FullscreenContainer card height="100%">
        <FullscreenContainer.Row flexDirection="row" alignItems="center">
          <FullscreenContainer.Item flexGrow={1} paddingHorizontal={2} paddingVertical={2}>
            <Text textStyle="headline5">{title}</Text>
          </FullscreenContainer.Item>
          <IconButton icon="close" color="white" onClick={onClose} />
        </FullscreenContainer.Row>
        {show ? <Content onItemClick={onItemClick} /> : null}
      </FullscreenContainer>
    </Dialog>
  );
}

function Content({ onItemClick }: { onItemClick: (item: AdminEntity) => void }) {
  const [searchEntityState, dispatchSearchEntityState] = useReducer(
    reduceSearchEntityState,
    [],
    initializeSearchEntityState
  );

  // load search/total or sampling
  useAdminLoadSearchEntitiesAndTotalCount(
    searchEntityState.paging ? (searchEntityState.query as AdminSearchQuery) : undefined,
    searchEntityState.paging,
    dispatchSearchEntityState
  );

  useAdminLoadSampleEntities(
    searchEntityState.sampling ? (searchEntityState.query as AdminQuery) : undefined,
    searchEntityState.sampling,
    dispatchSearchEntityState
  );

  return (
    <>
      <FullscreenContainer.ScrollableRow
        scrollToTopSignal={searchEntityState.entitiesScrollToTopSignal}
      >
        <FullscreenContainer.Row>
          <AdminEntityList {...{ searchEntityState, dispatchSearchEntityState, onItemClick }} />
        </FullscreenContainer.Row>
      </FullscreenContainer.ScrollableRow>
      <FullscreenContainer.Row
        paddingHorizontal={2}
        paddingVertical={2}
        columnGap={2}
        flexDirection="row"
        alignItems="center"
      >
        <SearchOrSampleEntitiesButtons {...{ searchEntityState, dispatchSearchEntityState }} />
      </FullscreenContainer.Row>
    </>
  );
}
