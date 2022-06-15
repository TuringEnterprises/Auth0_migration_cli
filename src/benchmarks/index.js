import benchFileSplitting from './fileSplitting.js';

async function benchmark() {
    await benchFileSplitting();
}

benchmark().then(() => console.log('Done'), console.error);
