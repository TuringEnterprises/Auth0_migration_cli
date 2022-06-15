import fs from 'fs';

const getStringSize = (string) => string.length;

const createFile = (fileList, fileName = 'payload.json') => {
    fs.writeFileSync(fileName, JSON.stringify(fileList));

    return fs.statSync(fileName);
};

const generateFile = (file, filename, fileList) => {
    createFile(file, filename);
    fileList.push(filename);
};

const splitArray = (listOfFiles) => {
    const fileList = [];
    let newFile = [];

    const MAXIMUM_OBJECT_SIZE = 390000;

    for (let i = 0; i < listOfFiles.length; i++) {

        //LIST OF OBJECTS THAT THEIR SIZES ARE BEING CALCULATED
        const tempNewFile = [...newFile, listOfFiles[i]];
        const tempNewFileSize = getStringSize(JSON.stringify(tempNewFile));

        //CHECK IF CALCULATED OBJECTS SIZE IS GREATER THAN MAXIMUM OBJECT SIZE
        if (tempNewFileSize > MAXIMUM_OBJECT_SIZE) {
            generateFile(newFile, `./files/${i}-${tempNewFileSize}.json`, fileList);
            newFile = [listOfFiles[i]];
            //CHECK IF REMAINING OBJECT IS LAST IN THE LIST
            if (i === listOfFiles.length - 1 && newFile.length) {
                generateFile(newFile, `./files/${i}-${tempNewFileSize}-last.json`, fileList);
                newFile = [];
                break;
            }
            continue;
        }

        //CHECK IF CALCULATED OBJECTS SIZE IS EQUAL TO MAXIMUM OBJECT SIZE
        if (tempNewFileSize === MAXIMUM_OBJECT_SIZE) {
            generateFile(tempNewFile, `./files/${i}-${tempNewFileSize}.json`, fileList);
            newFile = [];
            continue;
        }

        //CHECK IF CURRENT OBJECT IS THE LAST OBJECT IN THE LIST
        if (i === listOfFiles.length - 1 && newFile.length) {
            generateFile(newFile, `./files/${i}-${tempNewFileSize}-last.json`, fileList);
            newFile = [];
            break;
        }

        newFile = tempNewFile;
    }
    return fileList;
};

export async function balancedFileList(fileList, fileIndex) {
    const BYTE_KILO_CONVERSION = 0.001;
    const MAX_FILE_SIZE = 500;

    const filename = `./files/all-user${fileIndex}.json`;
    const file = createFile(fileList, filename);
    if (roundOff(file.size * BYTE_KILO_CONVERSION) > MAX_FILE_SIZE) {
        deleteFile(filename);

        const splittedFileList = splitArray(fileList);

        return splittedFileList;
    }

    return [filename];
}

export function deleteFile(filename) {
    fs.unlinkSync(filename);
}

function roundOff(value) {
    return Math.round(value * 100) / 100;
}
