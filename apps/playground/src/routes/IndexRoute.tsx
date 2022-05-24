import { Card, FullscreenContainer } from '@jonasb/datadata-design';
import { useCallback, useContext } from 'react';
import { Database } from 'sql.js';
import useSWR from 'swr';
import { NavBar } from '../components/NavBar';
import { DatabaseContext } from '../contexts/DatabaseContext';
import { bytesToHumanSize } from '../utils/DisplayUtils';

export function IndexRoute() {
  const { database, createDatabase } = useContext(DatabaseContext);
  const { data } = useSWR(database, queryDatabaseSize);

  const handleDownloadOnClick = useCallback(() => {
    if (database) downloadDatabase(database);
  }, []);

  return (
    <FullscreenContainer>
      <FullscreenContainer.Row fullWidth>
        <NavBar current="home" />
      </FullscreenContainer.Row>
      <FullscreenContainer.Row>
        <Card>
          <Card.Header>
            <Card.HeaderTitle>Database (sqlite3, in-memory)</Card.HeaderTitle>
          </Card.Header>
          <Card.Content>Size: {data ? bytesToHumanSize(data.byteSize) : '–'}</Card.Content>
          <Card.Footer>
            <Card.FooterButton
              disabled={!database}
              onClick={() => {
                if (window.confirm('Are you sure you want to delete the current database?')) {
                  createDatabase();
                }
              }}
            >
              Reset
            </Card.FooterButton>
            <Card.FooterButton disabled={!database} onClick={handleDownloadOnClick}>
              Download
            </Card.FooterButton>
          </Card.Footer>
        </Card>
      </FullscreenContainer.Row>
    </FullscreenContainer>
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
  a.download = 'datadata.sqlite3';
  a.onclick = () => {
    setTimeout(() => {
      window.URL.revokeObjectURL(a.href);
    }, 1500);
  };
  a.click();
}
