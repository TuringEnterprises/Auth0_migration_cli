import mysql from 'mysql';
import util from 'util';

const connectToDB = async (payload) => {
    try {
        const { dbHost, dbPort, dbPassword, dbName, dbUser, tableName } = payload;

        const connection = mysql.createConnection({
            host: dbHost,
            port: dbPort,
            user: dbUser,
            password: dbPassword,
            database: dbName,
        });

        // connect to the database
        connection.connect((err) => {
            if (err) {
                throw err;
            }
            console.log('connected as... ' + connection.threadId);
        });

        return {
            connection,
            tableName,
        };
    } catch (error) {
        throw error;
    }
};

export const queryUserTable = async (tablePayload) => {
    const { tableName, connection } = await connectToDB(tablePayload);

    const postmatchRoles = {
        ADMIN: 0,
        MANAGER: 1,
        TPM: 2,
        DEVELOPER: 3,
        ANYONE: 4,
    };
    const postMatchObjectValues = Object.values(postmatchRoles);

    const postMatchObjectKeys = Object.keys(postmatchRoles);

    const query = util.promisify(connection.query).bind(connection);

    const tableCount = `SELECT COUNT(email) as totalTableCount FROM ${tableName}`;
    const count = (await query(tableCount))[0].totalTableCount;
    const BATCH_LIMIT = 500;

    const userList = [];
    for (let i = 0; i < count; i += BATCH_LIMIT) {
        const queryString = `SELECT email, password, user_role_id, name  FROM ${tableName} LIMIT ${BATCH_LIMIT} OFFSET ${i}`;
        const queryResult = await query(queryString);
        const responseFromDB = Object.values(JSON.parse(JSON.stringify(queryResult)));

        const postMatchUsers = responseFromDB.map((item) => {
            const rolesIndex = postMatchObjectValues.indexOf(item.user_role_id);
            item.app_metadata = { roles: [postMatchObjectKeys[rolesIndex]] };
            return item;
        });
        userList.push(postMatchUsers);
    }

    connection.end();

    return userList.flat();
};
