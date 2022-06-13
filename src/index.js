import fs from 'fs';
import axios from 'axios';
import arg from 'arg';
import FormData from 'form-data';
import pkg from 'inquirer';
import { deleteFile } from './calculateSize.js';
import { generateUserFileListFromDB, updateUserWithAuth0Id, updateAuth0NullValues } from './dbConnection.js';
import readFile from './readFile.js';
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
        throw new Error(`These keys were not found in your Auth0 config file: ${absentKey.join(',')}`);
    }
};

/*
 * Start Import job
 */
const startImportProcess = async () => {
    const databaseCredentials = await askDbCredentials();

    const accessCredentials = await readFile(databaseCredentials.pathName);
    validateCredentials(accessCredentials);
    await queryTableAndUploadRecord(databaseCredentials, accessCredentials);
};

/*
 * Query table to return user record and upload to auth0
 */

async function queryTableAndUploadRecord(databaseCredentials, accessCredentials) {
    try {
        const files = await generateUserFileListFromDB(databaseCredentials);

        console.log(`Generated ${files.length} file(s)`);

        console.log('Uploading users data');
        //FIX
        for (const file of files) {
            await importUserJob({ data: accessCredentials, filePath: file });

            const userList = await readFile(file);

            deleteFile(file);

            for (const user of userList) {
                const auth0Response = await getAuth0EmailAndId(user.email, accessCredentials);
                if (auth0Response.email && auth0Response.auth0Id) {
                    await updateUserWithAuth0Id(auth0Response, databaseCredentials);
                }
            }
        }

        console.log('Completed user import.');
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
 * Get Auth0 email and auth0Id
 */
export async function getAuth0EmailAndId(email, accessCredentials) {
    try {
        const options = {
            method: 'GET',
            params: { q: `${email}`, search_engine: 'v3' },
            headers: {
                'content-type': 'application/json',
                authorization: 'Bearer ' + (await getAuth0AccessToken(accessCredentials)),
            },
        };
        const apiResponse = (await axios.get(`${accessCredentials.AUTH0_TENANT}/api/v2/users`, options))?.data;

        return {
            auth0Id: apiResponse[0]?.user_id,
            email: apiResponse[0]?.email,
        };
    } catch (error) {
        throw error;
    }
}

/*
 * Check job status with an option to retry
 */
async function checkJobStatusAfterUpload(jobId, accessCredentials) {
    const { data } = await getJobStatus(jobId, accessCredentials);
    console.log(data);

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
}

/*
 * Parse CLI Arguments
 */
function parseArgumentIntoOptions(cliOptions) {
    const args = arg(
        {},
        {
            argv: cliOptions.slice(2),
        },
    );

    const cliMethods = {
        update: updateDBWithAuth0Id,
    };

    return cliMethods[args._[0]] ? cliMethods[args._[0]] : startImportProcess;
}

/*
 * CLI Entry Function
 */

async function migrateCliEntryPoint(cliArgs) {
    const requiredCliMethod = parseArgumentIntoOptions(cliArgs);
    await requiredCliMethod();
}

/*
 * Update DB with Auth0Id
 */
async function updateDBWithAuth0Id() {
    const databaseCredentials = await askDbCredentials();

    const accessCredentials = await readFile(databaseCredentials.pathName);
    validateCredentials(accessCredentials);
    await updateAuth0NullValues(databaseCredentials, accessCredentials);
}

export default migrateCliEntryPoint;
