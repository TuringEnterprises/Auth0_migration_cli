import dbConfigs from '../../configs/database.js';
import userRoles from '../../configs/userRoles.js';
import dbPool from './dbConnector.js';

export const getUsersCount = async () => {
    const dbConnection = await dbPool.getConnection();

    const [countResponse] = await dbConnection.query(`SELECT COUNT(*) as usersCount FROM ${dbConfigs.userTable} where user_role_id = ${userRoles.MANAGER}`);
    dbPool.end();
    return countResponse[0]?.usersCount;
}

export const getUsersForImport = async () => {
    const dbConnection = await dbPool.getConnection();
    const result = await dbConnection.query(`SELECT name, email, password as password_hash FROM ${dbConfigs.userTable} where user_role_id = ${userRoles.MANAGER}`);
    // const result = await dbConnection.query(`SELECT name, email, password as password_hash, IF(active=1, 'false', 'true') as blocked FROM ${dbConfigs.userTable} where user_role_id = ${userRoles.MANAGER}`);

    dbPool.end();
    return result[0];
}

export const getUserList = async () => {
    const dbConnection = await dbPool.getConnection();
    const result =  await dbConnection.query(`SELECT name, email FROM ${dbConfigs.userTable} where user_role_id = ${userRoles.MANAGER}`);

    dbPool.end();
    return result[0];
}