import fs from 'fs';
import path from 'path';
import util from 'util';

const readCredentials = async (pathName) => {
    try {
        const access = util.promisify(fs.access);
        await access(pathName);
        const resolvedFilePath = fs.readFileSync(path.resolve(pathName));
        return JSON.parse(resolvedFilePath);
    } catch (error) {
        throw error;
    }
};

export default readCredentials;
