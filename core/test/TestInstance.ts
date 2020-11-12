import { Instance } from '../src';

export default { createInstance };

async function createInstance({ loadSchema }: { loadSchema?: boolean }): Promise<Instance> {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const instance = new Instance({ databaseUrl: process.env.DATABASE_URL! });
  if (loadSchema === true || loadSchema === undefined) {
    await instance.reloadSchema(instance.createAuthContext());
  }
  return instance;
}
