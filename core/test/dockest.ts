import { Dockest } from 'dockest';

const dockest = new Dockest({ composeFile: 'test-docker-compose.yml' });

const databaseUrl = 'postgres://testuser:testpass@localhost:5438/datadata-core-test';

const dockestServices = [
  {
    serviceName: 'db',
    commands: [`DATABASE_URL=${databaseUrl} npx datadata-pg-migrate`],
  },
];

dockest.run(dockestServices);
