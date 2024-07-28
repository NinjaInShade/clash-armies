import path from 'node:path';
import fsp from 'node:fs/promises';

function isEnclosedIn(value: string, quoteType: 'single' | 'double') {
    const _quoteType = quoteType === 'single' ? `'` : `"`;
    if (value[0] !== _quoteType && value[value.length - 1] !== _quoteType) {
        return false;
    }

    if (value[0] !== _quoteType) {
        throw new Error(`String is not fully enclosed in ${quoteType} quotes`);
    }
    if (value[value.length - 1] !== _quoteType) {
        throw new Error(`String is not fully enclosed in ${quoteType} quotes`);
    }

    return true;
};
async function getEnv() {
    const pathToEnv = path.join(process.cwd(), '../.env.test');
    let fileData;
    try {
        fileData = (await fsp.readFile(pathToEnv, { encoding: 'utf-8' })).trim();
    } catch (err) {
        if (err?.message.startsWith('ENOENT: no such file or directory')) {
            throw new Error(`Error reading .env file, make sure it exists at: '${pathToEnv}'`);
        }
        throw new Error(`Error reading .env file: ${err.message}`);
    }

    return fileData.split('\n').reduce<Record<string, unknown>>((prev, curr) => {
        let [name, value]: [string, string] = curr.split('=');
        const enclosedInSingle = isEnclosedIn(value, 'single');
        const enclosedInDouble = isEnclosedIn(value, 'double');
        if (enclosedInSingle || enclosedInDouble) {
            value = value.substring(1, value.length - 1);
        }
        prev[name] = value;
        return prev;
    }, {});
};

// Needed so that the '$env/dynamic/private' ts alias works in testing
const env = await getEnv();

// Add shims as needed
export { env };
