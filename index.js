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



//Run import job
export const run = async () => {
    // log(chalk."Runing...")
    // const status = new Spinner('Quering db for user record, please wait...');
    // status.start();
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
        console.log(`Generated ${data.length} file(s) from ${res.length}` )
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
    context.data.ACCOUNT_NAME = process.env.ACCOUNT_NAME 
    context.data.CLIENT_ID = process.env.AUTH0_CLIENT_ID
    context.data.CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET 
    context.filepath = filepath;
    console.log(filepath);
    await importUserJob(context, retries, numOfRetries)
};



/*
* Request a Auth0 access token every 30 minutes
*/

async function getAuth0AccessToken() {
    
    let accessToken = null;
    let lastLogin = null;
    const payload = {
        "client_id": process.env.AUTH0_MANAGEMENT_CLIENTID,
        "client_secret": process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
        "audience": process.env.AUTH0_AUDIENCE,
        "grant_type":"client_credentials"
      }

    if (!accessToken || !lastLogin || moment(new Date()).diff(lastLogin, 'minutes') > 30) {
        const res = await axios.post( `${process.env.AUTH0_TENANT}/oauth/token`, payload)
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
    try {
        const url = `${process.env.AUTH0_TENANT}/api/v2/jobs/users-imports`;
        const formData = new FormData();
        formData.append('users', fs.createReadStream(context.filepath));
        formData.append('send_completion_email', 'true');
        formData.append('connection_id', process.env.DB_CONNECTION_ID)

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
    try {
        const options = {
            method: 'GET',
            headers: {
                'content-type': 'application/json',
                authorization: 'Bearer ' + await getAuth0AccessToken()
              }
        }
        const resp = await axios.get(`${process.env.AUTH0_TENANT}/api/v2/jobs/${id}`, options);
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



//Create a config in a location
//Put location in gitignore
//Pass location to command line variable

//Read off location passed to the command line
//Fetch and load details of config file into index.js