import {
  Button,
  File,
  Message,
  NotificationContext,
  Text,
  toSpacingClassName,
} from '@dossierhq/design';
import type { ChangeEvent } from 'react';
import { useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatabaseContext } from '../contexts/DatabaseContext.js';
import { uploadDatabase } from '../utils/DatabaseUtils.js';
import { ROUTE } from '../utils/RouteUtils.js';

interface Props {
  className?: string;
}

export function LoadDatabaseMessage({ className }: Props) {
  const { createDatabase } = useContext(DatabaseContext);
  const { showNotification } = useContext(NotificationContext);
  const navigate = useNavigate();

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) {
        const file = event.target.files[0];
        uploadDatabase(file, createDatabase, showNotification, navigate);
        event.target.files = null;
      }
    },
    [createDatabase, navigate, showNotification]
  );

  return (
    <Message className={className} color="warning">
      <Message.Header>
        <Message.HeaderTitle>Load database</Message.HeaderTitle>
      </Message.Header>
      <Message.FlexBody alignItems="flex-start">
        <Text textStyle="headline5">Empty</Text>
        <p>Start from scratch with an empty database.</p>
        <Button
          as="a"
          className={toSpacingClassName({ marginTop: 2, marginBottom: 4 })}
          href={ROUTE.schema.url('new')}
        >
          Load empty database
        </Button>
        <Text textStyle="headline5">Example: Dossier docs</Text>
        <p>
          The database used for the{' '}
          <a href="https://dossierhq.dev/docs" target="_blank" rel="noopener noreferrer">
            Dossier documentation
          </a>
          .
        </p>
        <Button
          as="a"
          className={toSpacingClassName({ marginTop: 2, marginBottom: 4 })}
          href={ROUTE.content.url('dossier-docs')}
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
          as="a"
          className={toSpacingClassName({ marginTop: 2, marginBottom: 4 })}
          href={ROUTE.content.url('blog')}
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
          as="a"
          className={toSpacingClassName({ marginTop: 2, marginBottom: 4 })}
          href={ROUTE.content.url('reviews')}
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
          as="a"
          className={toSpacingClassName({ marginTop: 2, marginBottom: 4 })}
          href={ROUTE.content.url('starwars')}
        >
          Load Star Wars
        </Button>
        <Text textStyle="headline5">Example: Catalog</Text>
        <p>An example database with most variations of entity and value types.</p>
        <Button
          as="a"
          className={toSpacingClassName({ marginTop: 2, marginBottom: 4 })}
          href={ROUTE.content.url('catalog')}
        >
          Load Catalog
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
