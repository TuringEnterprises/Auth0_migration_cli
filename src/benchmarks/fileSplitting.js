import path from 'path';
import fs from 'fs/promises';
import { promisify } from 'util';
import rimraf from 'rimraf';
import { suite, add, cycle, complete, save } from 'benny';
import { faker } from '@faker-js/faker';
import saveToFiles from '../saveToFiles.js';
import { balancedFileList } from '../calculateSize.js';

function generateUsers(length = 10_000) {
    return Array.from({ length }, (_, i) => ({
        user_id: i + 1,
        email: faker.internet.email(),
        name: faker.name.findName(),
        password: '$2b$10$nkVdgTfwP5irvWkkZM51zuUWRu4dzbjqWeEYJnuRdBBKJ0UgpeeaO',
    }));
}

async function ensureDirectory(directory) {
    await fs.mkdir(directory, { recursive: true });
}

export default async () => {
    const users = generateUsers();
    // drop folder just in case
    await promisify(rimraf)(path.join(process.cwd(), 'files'));

    const FOLDER = path.join(process.cwd(), 'files', 'generator');
    await ensureDirectory(FOLDER);

    await suite(
        'File splitting',
        add('Splitting before saving', () => async () => {
            await saveToFiles(users, FOLDER);
        }),

        add(
            'Using balancedFileList',
            async () => {
                let fileIndex = Date.now(); // I don't want to change the signature for balancedFileList

                return async () => {
                    await balancedFileList(users, fileIndex++);
                };
            },
            {
                maxTime: 10, // it is taking more than default 5 seconds
            },
        ),

        cycle(),

        complete(),

        save({
            file: 'splitting',
            details: true,
        }),
    );
};
