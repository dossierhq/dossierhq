import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.js';
import { DatabaseBackupIcon } from 'lucide-react';
import { LoadDatabaseMessage } from '../components/LoadDatabaseMessage.js';
import logo from '../components/logo.svg';

export function IndexRoute() {
  return (
    <div>
      <main className="container py-4">
        <img className="m-auto mb-6" src={logo} alt="Dossier logo" width={400} height={106} />
        <h1 className="text-4xl font-extrabold tracking-tight">
          Welcome to Dossier Playground! 👋
        </h1>
        <p className="mt-2 leading-7">
          This is a playground where you can explore{' '}
          <a href="https://dossierhq.dev" target="_blank" rel="noopener noreferrer">
            Dossier
          </a>
          . Either start with an empty database or load one of the example databases below. Check
          out the{' '}
          <a href="https://dossierhq.dev/docs" target="_blank" rel="noopener noreferrer">
            documentation
          </a>{' '}
          for more information.
        </p>
        <p className="mt-2 leading-7">Happy playing! 🎉</p>
        <Alert className="mt-4" variant="destructive">
          <DatabaseBackupIcon className="h-4 w-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            <p>
              The database in the Playground is only stored in your browser. If you close or refresh
              the browser tab all changes will be lost.
            </p>
            <p>Make sure to download a copy of the database if you want to keep it.</p>
          </AlertDescription>
        </Alert>
        <LoadDatabaseMessage />
      </main>
    </div>
  );
}
