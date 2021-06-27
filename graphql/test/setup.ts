import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// eslint-disable-next-line @typescript-eslint/no-empty-function
export default function (): void {}
