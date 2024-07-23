import { Button } from '@/components/ui/button.js';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card.js';
import { useCallback, useContext, type ChangeEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { DatabaseContext } from '../contexts/DatabaseContext.js';
import { uploadDatabase } from '../utils/DatabaseUtils.js';
import { ROUTE } from '../utils/RouteUtils.js';
import { Input } from './ui/input.js';

function showNotification(_message: object) {
  //TODO
}

export function LoadDatabaseMessage() {
  const { createDatabase } = useContext(DatabaseContext);
  const navigate = useNavigate();

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) {
        const file = event.target.files[0];
        uploadDatabase(file, createDatabase, showNotification, navigate);
        event.target.files = null;
      }
    },
    [createDatabase, navigate],
  );

  return (
    <>
      <h2 className="mt-10 pb-4 text-3xl font-semibold tracking-tight">Custom project</h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <ProjectCard
          title="Create new project"
          link={ROUTE.contentList.url('new')}
          linkText="Create"
        >
          Start from scratch with an empty project.
        </ProjectCard>
        <Card>
          <CardHeader>
            <CardTitle>Upload project</CardTitle>
            <CardDescription>
              You can upload a database that you’ve previously downloaded from the Playground.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Input
              type="file"
              accept=".sqlite, application/x-sqlite3"
              onChange={handleFileChange}
            />
          </CardFooter>
        </Card>
      </div>

      <h2 className="mt-10 pb-4 text-3xl font-semibold tracking-tight">Example project</h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <ProjectCard title="Dossier docs" link={ROUTE.contentList.url('dossier-docs')}>
          The database used for the{' '}
          <a
            className="font-semibold underline"
            href="https://dossierhq.dev/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Dossier documentation
          </a>
          .
        </ProjectCard>
        <ProjectCard title="Blog" link={ROUTE.contentList.url('blog')}>
          <p>An example database with fake blog posts and people.</p>
          <p>
            The information is generated using{' '}
            <a
              className="font-semibold underline"
              href="https://fakerjs.dev/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Faker
            </a>{' '}
            with sample images provided by{' '}
            <a
              className="font-semibold underline"
              href="https://cloudinary.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Cloudinary
            </a>
            .
          </p>
        </ProjectCard>
        <ProjectCard title="Reviews" link={ROUTE.contentList.url('reviews')}>
          <p>
            An example database with fake information about places of business, reviewers, reviews
            and personal notes.
          </p>
          <p>
            The information is generated using{' '}
            <a
              className="font-semibold underline"
              href="https://fakerjs.dev/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Faker
            </a>
            .
          </p>
        </ProjectCard>
        <ProjectCard title="Star Wars" link={ROUTE.contentList.url('starwars')}>
          <p>
            An example database with information about Star Wars films, people, species, planets,
            star ships, transports and vehicles.
          </p>
          <p>
            The information comes from{' '}
            <a
              className="font-semibold underline"
              href="https://swapi.dev/"
              target="_blank"
              rel="noopener noreferrer"
            >
              SWAPI
            </a>{' '}
            (The Star Wars API).
          </p>
        </ProjectCard>
        <ProjectCard title="Catalog" link={ROUTE.contentList.url('catalog')}>
          <p>An example database with most variations of entity and component types.</p>
        </ProjectCard>
      </div>
    </>
  );
}

function ProjectCard({
  title,
  link,
  linkText,
  children,
}: {
  title: string;
  link: string;
  linkText?: string;
  children: ReactNode;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-grow">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{children}</CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-col items-stretch">
        <Button asChild>
          <a href={link}>{linkText ?? 'Load'}</a>
        </Button>
      </CardFooter>
    </Card>
  );
}
