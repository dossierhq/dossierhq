import Postgrator from 'postgrator';

const migrationDirectory = new URL('../migrations', import.meta.url).pathname;

export async function migrateDatabaseSchema({ execQuery }, targetVersion) {
  const postgrator = new Postgrator({
    migrationPattern: `${migrationDirectory}/*`,
    driver: 'pg',
    schemaTable: 'schemaversion',
    execQuery,
  });

  const appliedMigrations = await postgrator.migrate(targetVersion);
  return { appliedMigrations };
}
