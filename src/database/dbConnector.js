import mysql from "mysql2/promise";
import dbConfigs from "../../configs/database.js";

// Initialize pool
const { host, user, password, database, port } = dbConfigs;
const dbPool = mysql.createPool({
    host, user, password, database, port,
    connectionLimit: 10,
    debug: false
});

export default dbPool;
