import fs from 'fs/promises';
import path from 'path';
const readCredentials = async (pathName) => {
    try {
        await fs.access(pathName);
        const resolvedCredentials = await fs.readFile(path.resolve(pathName));
        return JSON.parse(resolvedCredentials);
    } catch (error) {
        throw error;
    }
};

export default readCredentials;
