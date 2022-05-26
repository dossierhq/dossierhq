import { Button, Message } from '@jonasb/datadata-design';
import { useCallback, useContext } from 'react';
import { Database } from 'sql.js';
import useSWR from 'swr';
import { DatabaseContext } from '../contexts/DatabaseContext';
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

function queryDatabaseSize(database: Database) {
  const result = database.exec('PRAGMA page_size; PRAGMA page_count');
  const pageSize = result[0].values[0][0] as number;
  const pageCount = result[1].values[0][0] as number;
  const byteSize = pageSize * pageCount;
  return { byteSize };
}

function downloadDatabase(database: Database) {
  const data = database.export();
  const blob = new Blob([data]);
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.href = window.URL.createObjectURL(blob);
  a.download = 'datadata.sqlite';
  a.onclick = () => {
    setTimeout(() => {
      window.URL.revokeObjectURL(a.href);
    }, 1500);
  };
  a.click();
}
