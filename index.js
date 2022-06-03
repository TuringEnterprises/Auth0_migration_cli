const readCredentials = require( './readFile');

const request = require('request');
const fs = require('fs');
const moment = require('moment')
const axios = require('axios')
const CLI = require('clui');
const FormData = require('form-data');
require('dotenv').config()
const Spinner = CLI.Spinner;
// const chalk = require('chalk');
const program = require('commander');
const {
    prompt
} = require('inquirer');
const {jsonAlgorithm, deleteFile} = require('./calculateSize');
const runDB = require('./dbConnection')



const askDbCredentials = async () => {
    const questions = [{
            type: 'input',
            name: 'dbHost',
            message: 'Enter Database host',
            validate: function (value) {
                if (value.length) {
                    return true;
                } else {
                    return 'Please enter your database connection string.';
                }
            }
        },
        {
            type: 'input',
            name: 'dbName',
            message: 'Enter Database name',
            validate: function (value) {
                if (value.length) {
                    return true;
                } else {
                    return 'Please enter database name';
                }
            }
        },
        {
            type: 'password',
            name: 'dbPassword',
            message: 'Enter DB password',
            validate: function (value) {
                if (value.length) {
                    return true;
                } else {
                    return 'Enter DB password';
                }
            }
        },
        {
            type: 'input',
            name: 'dbPort',
            message: 'Enter Database Port',
            validate: function (value) {
                if (value.length) {
                    return true;
                } else {
                    return 'Enter Database Port';
                }
            }
        },
        {
            type: 'input',
            name: 'dbUser',
            message: 'Enter Database User',
            validate: function (value) {
                if (value.length) {
                    return true;
                } else {
                    return 'Enter Database User';
                }
            }
        },
        {
            type: 'input',
            name: 'table_name',
            message: 'Enter Table Name',
            validate: function (value) {
                if (value.length) {
                    return true;
                } else {
                    return 'Enter Table Name';
                }
            }
        },
        {
            type: 'confirm',
            name: 'retries',
            message: 'Enable upload failure retry?',
            default: false,
        },

    ];
    return await prompt(questions);
}


const validateCredentials = (obj) => {
    const absentKey = []
    if (!obj.ACCOUNT_NAME) {
        absentKey.push("ACCOUNT_NAME")
    }
    if (!obj.AUTH0_CLIENT_ID) {
        absentKey.push("AUTH0_CLIENT_ID")
    }
    if (!obj.AUTH0_CLIENT_SECRET) {
        absentKey.push("AUTH0_CLIENT_SECRET")
    }
    if (!obj.AUTH0_MANAGEMENT_CLIENTID) {
        absentKey.push("AUTH0_MANAGEMENT_CLIENTID")
    }
    if (!obj.AUTH0_MANAGEMENT_CLIENT_SECRET) {
        absentKey.push("AUTH0_MANAGEMENT_CLIENT_SECRET")
    }
    if (!obj.AUTH0_AUDIENCE) {
        absentKey.push("AUTH0_AUDIENCE")
    }
    if (!obj.DB_CONNECTION_ID) {
        absentKey.push("DB_CONNECTION_ID")
    }
    if (!obj.AUTH0_TENANT) {
        absentKey.push("AUTH0_TENANT")
    }
    if(absentKey.length) {
        console.log(`This keys are not present within the .migrate_profile file ${absentKey.join(",")}`)
        process.exit(1)
    }
}


//Run import job
export const run = async () => {
    // log(chalk."Runing...")
    // const status = new Spinner('Quering db for user record, please wait...');
    // status.start();
    const accessCredentials = await readCredentials()
    validateCredentials(accessCredentials)


    const credentials = await askDbCredentials();
    await queryTable(credentials)
    // status.stop();
    console.log("Done", credentials)
    // console.log(credentials);
};




// Query table
async function queryTable(payload) {
    
    
    try {
        //Add log
        //Add spinner
        const res = await runDB(payload)
        //End spinner

        //Add spinner
        const data = await jsonAlgorithm(res)
        console.log(`Generated ${data.length} file(s) from ${res.length} array of users` )
        //CLose spiiner

        console.log("Uploading users data")
        //Start spinner
        data.forEach(async(itm) => {
            await importUsers(itm, payload.retries, 2);
            deleteFile(itm);
        })

        //Close spinner
        console.log("Uploaded users data")
    } catch (error) {
        console.log("Failed", error);
        process.exit(1);
    }

}





let context = {};

context.data = {};

/*
 * Import users workflow
 */

async function importUsers(filepath, retries, numOfRetries) {
    const { ACCOUNT_NAME, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET } = await readCredentials()
    context.data.ACCOUNT_NAME = ACCOUNT_NAME
    context.data.CLIENT_ID = AUTH0_CLIENT_ID
    context.data.CLIENT_SECRET = AUTH0_CLIENT_SECRET
    context.filepath = filepath;
    console.log(filepath);
    await importUserJob(context, retries, numOfRetries)
};



/*
* Request a Auth0 access token every 30 minutes
*/

async function getAuth0AccessToken() {
    const { AUTH0_MANAGEMENT_CLIENTID, AUTH0_MANAGEMENT_CLIENT_SECRET, AUTH0_AUDIENCE, AUTH0_TENANT } = await readCredentials()
    
    let accessToken = null;
    let lastLogin = null;
    const payload = {
        "client_id": AUTH0_MANAGEMENT_CLIENTID,
        "client_secret": AUTH0_MANAGEMENT_CLIENT_SECRET,
        "audience": AUTH0_AUDIENCE,
        "grant_type":"client_credentials"
      }

    if (!accessToken || !lastLogin || moment(new Date()).diff(lastLogin, 'minutes') > 30) {
        const res = await axios.post( `${AUTH0_TENANT}/oauth/token`, payload)
        lastLogin = moment();
        accessToken = res.data.access_token;
        
    }else {
        console.log("Error occured")
    }
    return accessToken
  };



  




/*
 * Import users workflow
 */

async function importUserJob(context, retries, numOfRetries) {
    const { DB_CONNECTION_ID, AUTH0_TENANT } = await readCredentials()
    try {
        const url = `${AUTH0_TENANT}/api/v2/jobs/users-imports`;
        const formData = new FormData();
        formData.append('users', fs.createReadStream(context.filepath));
        formData.append('send_completion_email', 'true');
        formData.append('connection_id', DB_CONNECTION_ID)

        const response = await axios({
            method: "post",
            url,
            data: formData,
            headers: { authorization: 'Bearer ' + await getAuth0AccessToken() },
          });

        console.log("response>>", response.data)
        return await getJobStatus(response.data.id, context, retries, numOfRetries)
    } catch (error) {
        console.log("error>>", error)
    }
}

async function getJobStatus(id, context, retries, numOfRetries) {
    const { AUTH0_TENANT } = await readCredentials()
    try {
        const options = {
            method: 'GET',
            headers: {
                'content-type': 'application/json',
                authorization: 'Bearer ' + await getAuth0AccessToken()
              }
        }
        const resp = await axios.get(`${AUTH0_TENANT}/api/v2/jobs/${id}`, options);
        console.log(resp.data)
        if (resp.data.status === "pending" || resp.data.status === "processing") {
                return await getJobStatus(resp.data.id, context, retries, numOfRetries)
        }
        
        if(resp.data.status === "completed"){
            if (resp.data.summary.failed > 0){
                //Call turing logging library to store errors
                console.log(`Failed to upload ${resp.data.summary.failed} of ${resp.data.summary.total} document(s)`)
            }
            if (resp.data.summary.failed === 0){
                console.log(`Uploaded ${resp.data.summary.total} of ${resp.data.summary.total} document(s)`)
            }
        }
        if (resp.data.status === 'failed'){

            //Enable retries after two attempts
            if (retries && numOfRetries > 0) {
                console.log('Failed to upload, Retrying...')
                return await importUsers(context.filepath, retries, numOfRetries - 1)
            }
            //Call turing logging library
            console.log("Failed to upload")
        }

    } catch (err) {
        // Handle Error Here
        console.error(err);
    }
};
