import * as TestDb from './TestDb';

export default async function (): Promise<void> {
  await TestDb.shutDown();
}
