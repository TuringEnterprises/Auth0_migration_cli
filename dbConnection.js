
const mysql = require("mysql");
const util = require("util"); 





const runDB = async (payload) => {

    const {dbHost, dbPort, dbPassword, dbName, dbUser, table_name} = payload

    const postmatchRoles = {
        ADMIN: 0,
        MANAGER: 1,
        TPM: 2,
        DEVELOPER: 3,
        ANYONE: 4,
      };
      const values = Object.values(postmatchRoles)
      const keys = Object.keys(postmatchRoles)

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
    let queryString = `SELECT email, password, user_role_id  FROM ${table_name} LIMIT 50`;  
    const queryResult =  await query(queryString).catch(err => {throw err}); 
    
     connection.end()

     const responseFromDB = Object.values(JSON.parse(JSON.stringify(queryResult)))
     
    
     return responseFromDB.map((item, index) => {
        let _index = values.indexOf(item.user_role_id)
        item['app_metadata'] = {roles: [keys[_index]]}
        return item
      })

}

module.exports = runDB


