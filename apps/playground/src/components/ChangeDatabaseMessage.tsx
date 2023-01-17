import {
  Button,
  File,
  Message,
  NotificationContext,
  Text,
  toSpacingClassName,
} from '@dossierhq/design';
import blogUrl from 'playground-example-generator/dist/blog.sqlite?url';
import reviewsUrl from 'playground-example-generator/dist/reviews.sqlite?url';
import starwarsUrl from 'playground-example-generator/dist/starwars.sqlite?url';
import type { ChangeEvent } from 'react';
import { useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatabaseContext } from '../contexts/DatabaseContext.js';
import { loadDatabaseFromUrl, resetDatabase, uploadDatabase } from '../utils/DatabaseUtils.js';

interface Props {
  className?: string;
}

export function ChangeDatabaseMessage({ className }: Props) {
  const { database, createDatabase } = useContext(DatabaseContext);
  const { showNotification } = useContext(NotificationContext);
  const navigate = useNavigate();

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) {
        const file = event.target.files[0];
        uploadDatabase(file, createDatabase, showNotification);
        event.target.files = null;
      }
    },
    [createDatabase, showNotification]
  );

  return (
    <Message className={className} color="warning">
      <Message.Header>
        <Message.HeaderTitle>Change database</Message.HeaderTitle>
      </Message.Header>
      <Message.FlexBody alignItems="flex-start">
        <Text textStyle="headline5">Reset</Text>
        <p>Reset the database to start from scratch.</p>
        <Button
          className={toSpacingClassName({ marginTop: 2, marginBottom: 4 })}
          disabled={!database}
          onClick={() => resetDatabase(createDatabase, showNotification)}
        >
          Reset
        </Button>
        <Text textStyle="headline5">Example: Dossier documentation</Text>
        <p>
          The database used for the{' '}
          <a href="https://dossierhq.dev/docs" target="_blank" rel="noopener noreferrer">
            Dossier documentation
          </a>
          .
        </p>
        <Button
          className={toSpacingClassName({ marginTop: 2, marginBottom: 4 })}
          onClick={() =>
            loadDatabaseFromUrl(
              `${import.meta.env.BASE_URL}dossier-docs.sqlite`,
              createDatabase,
              showNotification,
              navigate
            )
          }
        >
          Load Dossier docs
        </Button>
        <Text textStyle="headline5">Example: Blog</Text>
        <p>An example database with fake blog posts and people.</p>
        <p>
          The information is generated using{' '}
          <a href="https://fakerjs.dev/" target="_blank" rel="noopener noreferrer">
            Faker
          </a>{' '}
          with sample images provided by{' '}
          <a href="https://cloudinary.com/" target="_blank" rel="noopener noreferrer">
            Cloudinary
          </a>
          .
        </p>
        <Button
          className={toSpacingClassName({ marginTop: 2, marginBottom: 4 })}
          onClick={() => loadDatabaseFromUrl(blogUrl, createDatabase, showNotification, navigate)}
        >
          Load Blog
        </Button>
        <Text textStyle="headline5">Example: Reviews</Text>
        <p>
          An example database with fake information about places of business, reviewers, reviews and
          personal notes.
        </p>
        <p>
          The information is generated using{' '}
          <a href="https://fakerjs.dev/" target="_blank" rel="noopener noreferrer">
            Faker
          </a>
          .
        </p>
        <Button
          className={toSpacingClassName({ marginTop: 2, marginBottom: 4 })}
          onClick={() =>
            loadDatabaseFromUrl(reviewsUrl, createDatabase, showNotification, navigate)
          }
        >
          Load Reviews
        </Button>
        <Text textStyle="headline5">Example: Star Wars</Text>
        <p>
          An example database with information about Star Wars films, people, species, planets, star
          ships, transports and vehicles.
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
          onClick={() =>
            loadDatabaseFromUrl(starwarsUrl, createDatabase, showNotification, navigate)
          }
        >
          Load Star Wars
        </Button>
        <Text textStyle="headline5">Upload database</Text>
        <p>You can upload a database that you’ve previously downloaded from the Playground.</p>
        <File
          className={toSpacingClassName({ marginTop: 2 })}
          accept=".sqlite, application/x-sqlite3"
          onChange={handleFileChange}
        />
      </Message.FlexBody>
    </Message>
  );
}
