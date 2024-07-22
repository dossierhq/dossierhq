import { Button, Message, NotificationContext, Row } from '@dossierhq/design';
import { useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { DatabaseContext } from '../contexts/DatabaseContext.js';
import { downloadDatabase, queryDatabaseSize, resetDatabase } from '../utils/DatabaseUtils.js';
import { bytesToHumanSize } from '../utils/DisplayUtils.js';

interface Props {
  className?: string;
}

export function DatabaseInfoMessage({ className }: Props) {
  const navigate = useNavigate();
  const { database, clearDatabase } = useContext(DatabaseContext);
  const { showNotification } = useContext(NotificationContext);
  const { data } = useSWR(database, queryDatabaseSize);

  const handleDownloadOnClick = useCallback(() => {
    if (database) downloadDatabase(database);
  }, [database]);

  return (
    <Message className={className}>
      <Message.Header>
        <Message.HeaderTitle>Database (SQLite, in-memory)</Message.HeaderTitle>
      </Message.Header>
      <Message.FlexBody gap={3} alignItems="flex-start">
        <p>
          <strong>Size:</strong> {data ? bytesToHumanSize(data.byteSize) : '–'}
        </p>
        <Button disabled={!database} iconLeft="download" onClick={handleDownloadOnClick}>
          Download
        </Button>
        <Row alignItems="center" gap={2}>
          <Button
            disabled={!database}
            iconLeft="delete"
            onClick={() => resetDatabase(clearDatabase, showNotification, navigate)}
          >
            Delete
          </Button>
          to start from scratch or try another example.
        </Row>
      </Message.FlexBody>
    </Message>
  );
}
