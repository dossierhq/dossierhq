import { Button, Message } from '@jonasb/datadata-design';
import { useCallback, useContext } from 'react';
import useSWR from 'swr';
import { DatabaseContext } from '../contexts/DatabaseContext';
import { downloadDatabase, queryDatabaseSize } from '../utils/DatabaseUtils';
import { bytesToHumanSize } from '../utils/DisplayUtils';

interface Props {
  className?: string;
}

export function DatabaseInfoMessage({ className }: Props) {
  const { database } = useContext(DatabaseContext);
  const { data } = useSWR(database, queryDatabaseSize);

  const handleDownloadOnClick = useCallback(() => {
    if (database) downloadDatabase(database);
  }, []);

  return (
    <Message className={className}>
      <Message.Header>
        <Message.HeaderTitle>Database (sqlite3, in-memory)</Message.HeaderTitle>
      </Message.Header>
      <Message.Body gap={3} alignItems="flex-start">
        <p>
          <strong>Size:</strong> {data ? bytesToHumanSize(data.byteSize) : '–'}
        </p>
        <Button disabled={!database} iconLeft="download" onClick={handleDownloadOnClick}>
          Download
        </Button>
      </Message.Body>
    </Message>
  );
}
