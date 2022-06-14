import mysql from 'mysql2/promise';
import { balancedFileList } from './calculateSize.js';
import { getAuth0EmailAndId } from './index.js';

const connectToDb = async (connectionArgs) => {
    try {
        const { dbHost, dbPort, dbPassword, dbName, dbUser } = connectionArgs;

        const connection = await mysql.createConnection({
            host: dbHost,
            port: dbPort,
            user: dbUser,
            password: dbPassword,
            database: dbName,
        });

        return {
            connection,
        };
    } catch (error) {
        throw error;
    }
};

export const generateUserFileListFromDB = async (tablePayload) => {
    const { connection } = await connectToDb(tablePayload);

    const postmatchRoles = {
        ADMIN: 0,
        MANAGER: 1,
        TPM: 2,
        DEVELOPER: 3,
        ANYONE: 4,
    };
    const postMatchObjectValues = Object.values(postmatchRoles);

    const postMatchObjectKeys = Object.keys(postmatchRoles);

    const tableCount = `SELECT COUNT(email) as totalTableCount FROM ${tablePayload.tableName}`;
    const [rows] = await connection.query(tableCount);
    const count = rows[0]?.totalTableCount;
    const BATCH_LIMIT = 500;

    const userFileList = [];
    for (let i = 0; i < count; i += BATCH_LIMIT) {
        const queryString = `SELECT email, password, user_role_id, name  FROM ${tablePayload.tableName} LIMIT ${BATCH_LIMIT} OFFSET ${i}`;
        const [queryResult] = await connection.query(queryString);

        const postMatchUsers = queryResult.map((item) => {
            const rolesIndex = postMatchObjectValues.indexOf(item.user_role_id);
            item.app_metadata = { roles: [postMatchObjectKeys[rolesIndex]] };
            return item;
        });
        const files = await balancedFileList(postMatchUsers, i);
        userFileList.push(files);
    }

    connection.end();

    return userFileList.flat();
};

export const updateUserWithAuth0Id = async (auth0Payload, tablePayload) => {
    const { connection } = await connectToDb(tablePayload);
    const updateQuery = `UPDATE ${tablePayload.tableName} SET authO_id = '${auth0Payload.auth0Id}' WHERE email = '${auth0Payload.email}'`;

    await connection.query(updateQuery);

    console.log('Updating user record....');
    await connection.end();
};

export const updateAuth0NullValues = async (tablePayload, accessCredentials) => {
    const { connection } = await connectToDb(tablePayload);
    const tableCount = `SELECT COUNT(email) as totalTableCount FROM ${tablePayload.tableName} WHERE authO_id IS NULL`;
    const [rows] = await connection.query(tableCount);
    const count = rows[0]?.totalTableCount;
    const BATCH_LIMIT = 500;

    for (let i = 0; i < count; i += BATCH_LIMIT) {
        const queryString = `SELECT email FROM ${tablePayload.tableName} WHERE authO_id IS NULL LIMIT ${BATCH_LIMIT} OFFSET ${i}`;
        const [queryResult] = await connection.query(queryString);

        for (i = 0; i < queryResult.length; i++) {
            const auth0Response = await getAuth0EmailAndId(queryResult[i].email, accessCredentials);
            if (auth0Response.email && auth0Response.auth0Id) {
                await updateUserWithAuth0Id(auth0Response, tablePayload);
            }
            console.log(`Auth0 record not found for email ${queryResult[i].email}`);
        }
    }
    console.log('Updated user records');

    connection.end();
};
