import { Card, Field, File, FullscreenContainer, Text } from '@jonasb/datadata-design';
import { ChangeEvent, useCallback, useContext } from 'react';
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

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      uploadDatabase(file, createDatabase);
      event.target.files = null;
    }
  }, []);

  return (
    <FullscreenContainer>
      <FullscreenContainer.Row fullWidth>
        <NavBar current="home" />
      </FullscreenContainer.Row>
      <FullscreenContainer.Row>
        <Text as="h1" textStyle="headline4">
          Welcome to datadata Playground!
        </Text>
        <Text textStyle="body1">This is a playground where you can explore datadata.</Text>
        <Card>
          <Card.Header>
            <Card.HeaderTitle>Database (sqlite3, in-memory)</Card.HeaderTitle>
          </Card.Header>
          <Card.Content>
            <strong>Size:</strong> {data ? bytesToHumanSize(data.byteSize) : '–'}
            <Field>
              <Field.Label>Upload new database</Field.Label>
              <Field.Control>
                <File accept=".sqlite, application/x-sqlite3" onChange={handleFileChange} />
              </Field.Control>
            </Field>
          </Card.Content>
          <Card.Footer>
            <Card.FooterButton
              disabled={!database}
              onClick={() => {
                if (window.confirm('Are you sure you want to delete the current database?')) {
                  createDatabase(null);
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
  a.download = 'datadata.sqlite';
  a.onclick = () => {
    setTimeout(() => {
      window.URL.revokeObjectURL(a.href);
    }, 1500);
  };
  a.click();
}

function uploadDatabase(file: File, createDatabase: (data: Uint8Array | null) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    const data = new Uint8Array(reader.result as ArrayBuffer);
    createDatabase(data);
  };
  reader.readAsArrayBuffer(file);
}
