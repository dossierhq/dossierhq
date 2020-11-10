import { Instance } from '../src';

export default { createInstance };

function createInstance(): Instance {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return new Instance({ databaseUrl: process.env.DATABASE_URL! });
}
