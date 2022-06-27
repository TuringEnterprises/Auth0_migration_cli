import fs from 'fs/promises';
import path from 'path';
const MAX_FILE_SIZE_BYTES = 500_000;

function* chunkify(iter, by = MAX_FILE_SIZE_BYTES) {
    const SEP = ',';
    const WRAP = '[]';

    let chunk = [];
    let size = by - WRAP.length;

    for (const item of iter) {
        const part = JSON.stringify(item);
        const lengthToAppend = part.length + SEP.length;
        const canAddMore = size > lengthToAppend;

        if (canAddMore) {
            size -= lengthToAppend;
            chunk.push(part);

            continue;
        }

        yield `[${chunk.join()}]`;

        chunk = [part];
        size = by - WRAP.length - lengthToAppend;
    }

    // emit last piece if not empty
    if (chunk.length) {
        yield `[${chunk.join()}]`;
    }
}

export async function saveToFiles(users, userIndex) {
    const folder = path.join(process.cwd(), 'files');
    async function saveChunk(chunk, i) {
        const fileName = path.join(folder, `chunk-${i}-${userIndex}.json`);
        await fs.writeFile(fileName, chunk);

        return fileName;
    }
    return await Promise.all([...chunkify(users)].map(saveChunk));
}

export async function deleteFile(filename) {
    await fs.unlink(filename);
}
