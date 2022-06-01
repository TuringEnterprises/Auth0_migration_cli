
const mysql = require("mysql");
const util = require("util"); 



const runDB = async (payload) => {

    const {dbHost, dbPort, dbPassword, dbName, dbUser, table_name} = payload

    const connection = mysql.createConnection({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName,
    });
    // promise wrapper to enable async await with MYSQL
    const query  = util.promisify(connection.query).bind(connection);

    // connect to the database
    connection.connect(function(err){
        if (err) {
            console.log("error connecting: " + err.stack);
            return;
        };
        console.log("connected as... " + connection.threadId);
    });
    let queryString = `SELECT email, password FROM ${table_name} LIMIT 50`;  
    const queryResult =  await query(queryString).catch(err => {throw err}); 
    
     connection.end()

     return Object.values(JSON.parse(JSON.stringify(queryResult)))
}

module.exports = runDB


