import {
  Button,
  File,
  FullscreenContainer,
  Message,
  NotificationContext,
  NotificationInfo,
  Text,
  toSpacingClassName,
} from '@jonasb/datadata-design';
import starwarsUrl from 'playground-example-generator/dist/starwars.sqlite?url';
import { ChangeEvent, useCallback, useContext } from 'react';
import { Database } from 'sql.js';
import useSWR from 'swr';
import { NavBar } from '../components/NavBar';
import { DatabaseContext } from '../contexts/DatabaseContext';
import { bytesToHumanSize } from '../utils/DisplayUtils';

export function IndexRoute() {
  const { database, createDatabase } = useContext(DatabaseContext);
  const { showNotification } = useContext(NotificationContext);
  const { data } = useSWR(database, queryDatabaseSize);

  const handleDownloadOnClick = useCallback(() => {
    if (database) downloadDatabase(database);
  }, []);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      uploadDatabase(file, createDatabase, showNotification);
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
        <Message className={toSpacingClassName({ marginTop: 5 })}>
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

        <Message className={toSpacingClassName({ marginTop: 3 })} color="warning">
          <Message.Header>
            <Message.HeaderTitle>Change database</Message.HeaderTitle>
          </Message.Header>
          <Message.Body alignItems="flex-start">
            <Text textStyle="headline5">Reset</Text>
            <p>Reset the database to start from scratch.</p>
            <Button
              className={toSpacingClassName({ marginTop: 2, marginBottom: 4 })}
              disabled={!database}
              onClick={() => resetDatabase(createDatabase, showNotification)}
            >
              Reset
            </Button>
            <Text textStyle="headline5">Example: Star Wars</Text>
            <p>
              An example database with information about Star Wars films, people, species, planets,
              star ships, transports and vehicles.
            </p>
            <p>
              The information comes from{' '}
              <a href="https://swapi.dev/" target="_blank" rel="noopener noreferrer">
                SWAPI
              </a>{' '}
              (The Star Wars API).
            </p>
            <Button
              className={toSpacingClassName({ marginTop: 2, marginBottom: 4 })}
              onClick={() => loadDatabaseFromUrl(starwarsUrl, createDatabase, showNotification)}
            >
              Load Star Wars
            </Button>
            <Text textStyle="headline5">Upload new database</Text>
            <p>You can upload a database that you've downloaded from the Playground before.</p>
            <File
              className={toSpacingClassName({ marginTop: 2 })}
              accept=".sqlite, application/x-sqlite3"
              onChange={handleFileChange}
            />
          </Message.Body>
        </Message>
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

function resetDatabase(
  createDatabase: (data: Uint8Array | null) => void,
  showNotification: (notification: NotificationInfo) => void
) {
  if (!window.confirm('Are you sure you want to delete the current database?')) {
    return;
  }

  createDatabase(null);
  showNotification({ color: 'success', message: 'New database created' });
}

async function loadDatabaseFromUrl(
  url: string,
  createDatabase: (data: Uint8Array | null) => void,
  showNotification: (notification: NotificationInfo) => void
) {
  if (!window.confirm('Are you sure you want to delete the current database?')) {
    return;
  }

  // Cleanup url when running in dev mode
  if (url.startsWith('/../')) {
    url = url.replace('/../', '/node_modules/');
  }

  const response = await fetch(url);
  if (response.ok) {
    const buffer = await response.arrayBuffer();
    const data = new Uint8Array(buffer);
    createDatabase(data);
    showNotification({ color: 'success', message: 'New database loaded' });
  } else {
    showNotification({ color: 'error', message: 'Failed downloading database' });
  }
}

function uploadDatabase(
  file: File,
  createDatabase: (data: Uint8Array | null) => void,
  showNotification: (notification: NotificationInfo) => void
) {
  if (!window.confirm('Are you sure you want to delete the current database?')) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const data = new Uint8Array(reader.result as ArrayBuffer);
    createDatabase(data);
    showNotification({ color: 'success', message: 'New database loaded' });
  };
  reader.readAsArrayBuffer(file);
}
