import path from 'node:path';
import { loadEnv } from '@ninjalib/util';

const envPath = path.join(process.cwd(), '../.env.test');
await loadEnv(envPath);

// Needed so that the '$env/dynamic/private' ts alias works in testing
const env = process.env;

// Add shims as needed
export { env };
