import { Button, Message } from '@dossierhq/design';
import { useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { DatabaseContext } from '../contexts/DatabaseContext.js';
import { clearDatabase, downloadDatabase, queryDatabaseSize } from '../utils/DatabaseUtils.js';
import { bytesToHumanSize } from '../utils/DisplayUtils.js';

interface Props {
  className?: string;
}

export function DatabaseInfoMessage({ className }: Props) {
  const navigate = useNavigate();
  const { database, createDatabase } = useContext(DatabaseContext);
  const { data } = useSWR(database, queryDatabaseSize);

  const handleDownloadOnClick = useCallback(() => {
    if (database) downloadDatabase(database);
  }, [database]);

  return (
    <Message className={className}>
      <Message.Header>
        <Message.HeaderTitle>Database (sqlite3, in-memory)</Message.HeaderTitle>
      </Message.Header>
      <Message.FlexBody gap={3} alignItems="flex-start">
        <p>
          <strong>Size:</strong> {data ? bytesToHumanSize(data.byteSize) : '–'}
        </p>
        <Button disabled={!database} iconLeft="download" onClick={handleDownloadOnClick}>
          Download
        </Button>
        <Button disabled={!database} onClick={() => clearDatabase(createDatabase, navigate)}>
          Clear
        </Button>
      </Message.FlexBody>
    </Message>
  );
}
