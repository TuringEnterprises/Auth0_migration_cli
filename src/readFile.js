import fs from 'fs/promises';
import path from 'path';
const readFile = async (pathName) => {
    try {
        await fs.access(pathName);
        const resolvedFileContent = await fs.readFile(path.resolve(pathName));
        return JSON.parse(resolvedFileContent);
    } catch (error) {
        throw error;
    }
};

export default readFile;
