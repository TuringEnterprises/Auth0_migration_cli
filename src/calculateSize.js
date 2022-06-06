const fs = require('fs');
// const path = require('path');

function calculatesMinLengthPErFiles(payload, payloadFileSize) {
    const sizePerObject = payloadFileSize / payload.length;

    const numberOfObjects = Math.floor(500 / sizePerObject);

    return numberOfObjects;
}

function createFile(payload, fileName) {
    const defaultfileName = fileName ? fileName : 'payload.json';
    fs.writeFileSync(defaultfileName, JSON.stringify(payload));

    return fs.statSync(defaultfileName);
}

function splitArray(payload, minlength) {
    const arrays = [];
    let startInd = 0;

    for (
        let i = minlength;
        i <= payload.length;
        i = i < payload.length && i + minlength > payload.length ? payload.length : i + minlength
    ) {
        const shallow = payload.slice();

        const arr = shallow.slice(startInd, i - 1);
        const filename = `${startInd}-${i}.json`;

        const file = createFile(arr, filename);

        console.log('File >> ', roundOff(file.size * 0.001));

        arrays.push(filename);

        startInd = i;
    }

    return arrays;
}

export async function jsonAlgorithm(payload) {
    console.log('Compiling user data');
    const filename = 'all-user.json';
    const file = createFile(payload, 'all-user.json');

    if (roundOff(file.size * 0.001) > 500) {
        deleteFile(filename);
        const minLength = calculatesMinLengthPErFiles(payload, roundOff(file.size * 0.001));

        // return minLength

        const arrays = splitArray(payload, minLength);

        return arrays;
    }

    return [filename];
}

export function deleteFile(filename) {
    fs.unlinkSync(filename);
}

function roundOff(value) {
    return Math.round(value * 100) / 100;
}
