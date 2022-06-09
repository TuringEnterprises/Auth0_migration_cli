import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import pkg from 'inquirer';
import { balancedFileList, deleteFile } from './calculateSize.js';
import { queryUserTable } from './dbConnection.js';
import readCredentials from './readFile.js';
const { prompt } = pkg;

const askDbCredentials = async () => {
    const questions = [
        {
            type: 'input',
            name: 'dbHost',
            message: 'Enter Database host',
            validate(value) {
                if (value.length) {
                    return true;
                }
                return 'Please enter your database connection string.';
            },
        },
        {
            type: 'input',
            name: 'dbName',
            message: 'Enter Database name',
            validate(value) {
                if (value.length) {
                    return true;
                }
                return 'Please enter database name';
            },
        },
        {
            type: 'password',
            name: 'dbPassword',
            message: 'Enter DB password',
            validate(value) {
                if (value.length) {
                    return true;
                }
                return 'Enter DB password';
            },
        },
        {
            type: 'input',
            name: 'dbPort',
            message: 'Enter Database Port',
            validate(value) {
                if (value.length) {
                    return true;
                }
                return 'Enter Database Port';
            },
        },
        {
            type: 'input',
            name: 'dbUser',
            message: 'Enter Database User',
            validate(value) {
                if (value.length) {
                    return true;
                }
                return 'Enter Database User';
            },
        },
        {
            type: 'input',
            name: 'tableName',
            message: 'Enter Table Name',
            validate(value) {
                if (value.length) {
                    return true;
                }
                return 'Enter Table Name';
            },
        },
        {
            type: 'input',
            name: 'pathName',
            message: 'Pass absolute path to Auth0 config file',
            validate(value) {
                if (value.length) {
                    return true;
                }
                return 'Enter Path to config file';
            },
        },
    ];
    return await prompt(questions);
};

const validateCredentials = (obj) => {
    const absentKey = [];
    if (!obj.ACCOUNT_NAME) {
        absentKey.push('ACCOUNT_NAME');
    }
    if (!obj.AUTH0_CLIENT_ID) {
        absentKey.push('AUTH0_CLIENT_ID');
    }
    if (!obj.AUTH0_CLIENT_SECRET) {
        absentKey.push('AUTH0_CLIENT_SECRET');
    }
    if (!obj.AUTH0_MANAGEMENT_CLIENTID) {
        absentKey.push('AUTH0_MANAGEMENT_CLIENTID');
    }
    if (!obj.AUTH0_MANAGEMENT_CLIENT_SECRET) {
        absentKey.push('AUTH0_MANAGEMENT_CLIENT_SECRET');
    }
    if (!obj.AUTH0_AUDIENCE) {
        absentKey.push('AUTH0_AUDIENCE');
    }
    if (!obj.DB_CONNECTION_ID) {
        absentKey.push('DB_CONNECTION_ID');
    }
    if (!obj.AUTH0_TENANT) {
        absentKey.push('AUTH0_TENANT');
    }
    if (absentKey.length) {
        throw new Error(`This keys were not found in your Auth0 config file ${absentKey.join(',')}`);
    }
};

//Start import job
const startImportProcess = async () => {
    const databaseCredentials = await askDbCredentials();

    const accessCredentials = await readCredentials(databaseCredentials.pathName);
    validateCredentials(accessCredentials);
    await queryTableAndUploadRecord(databaseCredentials, accessCredentials);
};

// Query table to return rows
async function queryTableAndUploadRecord(databaseCredentials, accessCredentials) {
    try {
        const postMatchUsers = await queryUserTable(databaseCredentials);

        const files = await balancedFileList(postMatchUsers);
        console.log(`Generated ${files.length} file(s) from ${postMatchUsers.length} array of users`);

        console.log('Uploading users data');
        //FIX
        for (const file of files) {
            await importUserJob({ data: accessCredentials, filePath: file });

            deleteFile(file);
        }

        console.log('Uploaded users data');
    } catch (error) {
        throw error;
    }
}

/*
 * Request  Auth0 access token
 */

async function getAuth0AccessToken(accessCredentials) {
    try {
        const payload = {
            client_id: accessCredentials.AUTH0_MANAGEMENT_CLIENTID,
            client_secret: accessCredentials.AUTH0_MANAGEMENT_CLIENT_SECRET,
            audience: accessCredentials.AUTH0_AUDIENCE,
            grant_type: 'client_credentials',
        };
        const res = await axios.post(`${accessCredentials.AUTH0_TENANT}/oauth/token`, payload);
        const accessToken = res.data.access_token;
        return accessToken;
    } catch (error) {
        throw error;
    }
}

/*
 * Import users workflow
 */

async function importUserJob(jobPayload) {
    try {
        const url = `${jobPayload.data.AUTH0_TENANT}/api/v2/jobs/users-imports`;
        const formData = new FormData();
        formData.append('users', fs.createReadStream(jobPayload.filePath));
        formData.append('send_completion_email', 'false');
        formData.append('connection_id', jobPayload.data.DB_CONNECTION_ID);

        const response = await axios({
            method: 'post',
            url,
            data: formData,
            headers: { authorization: 'Bearer ' + (await getAuth0AccessToken(jobPayload.data)) },
        });

        console.log('response>>', response.data);
        return await checkJobStatusAfterUpload(response.data.id, jobPayload.data);
    } catch (error) {
        throw error;
    }
}

/*
 * Get job status
 */

async function getJobStatus(jobId, accessCredentials) {
    try {
        const options = {
            method: 'GET',
            headers: {
                'content-type': 'application/json',
                authorization: 'Bearer ' + (await getAuth0AccessToken(accessCredentials)),
            },
        };
        const jobStatusResponse = await axios.get(`${accessCredentials.AUTH0_TENANT}/api/v2/jobs/${jobId}`, options);
        return jobStatusResponse;
    } catch (error) {
        throw error;
    }
}

/*
 * Check job status with an option to retry
 */
async function checkJobStatusAfterUpload(jobId, accessCredentials) {
    try {
        const { data } = await getJobStatus(jobId, accessCredentials);

        if (data.status === 'completed') {
            if (data.summary.failed > 0) {
                console.log(`Failed to upload ${data.summary.failed} of ${data.summary.total} document(s)`);
            }
            if (data.summary.failed === 0) {
                console.log(`Uploaded ${data.summary.total} of ${data.summary.total} document(s)`);
            }
        }
        if (data.status === 'failed') {
            console.log('Failed to upload');
        }
    } catch (error) {
        throw error;
    }
}

export default startImportProcess;
