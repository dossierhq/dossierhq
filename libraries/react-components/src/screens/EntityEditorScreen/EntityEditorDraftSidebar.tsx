import { Button, Dialog2, Row, Tag, Text } from '@dossierhq/design';
import { useContext, useState } from 'react';
import { AdminEntityHistoryDialog } from '../../components/AdminEntityHistoryDialog/AdminEntityHistoryDialog.js';
import { EntityChangelogList } from '../../components/EntityChangelogList/EntityChangelogList.js';
import { StatusTag } from '../../components/StatusTag/StatusTag.js';
import { AdminDossierContext } from '../../contexts/AdminDossierContext.js';
import type { EntityEditorState } from '../../reducers/EntityEditorReducer/EntityEditorReducer.js';
import { AuthKeyTag } from '../../shared/components/AuthKeyTag/AuthKeyTag.js';
import { assertIsDefined } from '../../utils/AssertUtils.js';
import { AdminEntityLinks } from './AdminEntityLinks.js';

interface Props {
  entityEditorState: EntityEditorState;
}

export function EntityEditorDraftSidebar({ entityEditorState }: Props) {
  const { authKeys } = useContext(AdminDossierContext);
  const { activeEntityId } = entityEditorState;

  const [historyIsOpen, setHistoryIsOpen] = useState(false);

  if (!activeEntityId) return null;
  const draftState = entityEditorState.drafts.find((it) => it.id === activeEntityId);
  assertIsDefined(draftState);

  const { draft, entity } = draftState;

  if (!draft) return null;

  return (
    <>
      <Text textStyle="headline6">{draft.name || <i>Untitled</i>}</Text>
      {entity ? (
        <>
          <Text textStyle="body2">{entity.id}</Text>
          <Row gap={2}>
            <StatusTag status={entity.info.status} />
            {!entity.info.valid ? <Tag color="danger">Invalid</Tag> : null}
            {entity.info.validPublished === false ? (
              <Tag color="danger">Invalid published</Tag>
            ) : null}
            <AuthKeyTag authKey={entity.info.authKey} authKeys={authKeys} />
          </Row>
          <AdminEntityLinks entityReference={{ id: entity.id }} />
          {entity.info.version > 1 ? (
            <Dialog2.Trigger isOpen={historyIsOpen} onOpenChange={setHistoryIsOpen}>
              <Button onClick={() => setHistoryIsOpen(true)}>Entity history</Button>
              <AdminEntityHistoryDialog reference={{ id: entity.id }} />
            </Dialog2.Trigger>
          ) : null}
          <Text textStyle="subtitle2">Changelog</Text>
          <EntityChangelogList entity={{ id: activeEntityId }} />
        </>
      ) : null}
    </>
  );
}
