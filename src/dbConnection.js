import mysql from 'mysql2/promise';
import { balancedFileList } from './calculateSize.js';

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

const generateUserFileListFromDB = async (tablePayload) => {
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

export default generateUserFileListFromDB;
