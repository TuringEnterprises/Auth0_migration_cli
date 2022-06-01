
const util = require('util');
const exec = util.promisify(require('child_process').exec);



const platform = process.platform
if (platform === "win32"){
    console.log("CLI credentials can't be read on this OS")
    process.exit(1)
}



async function readCredentials () {
  try {
    const { stdout, stderr} = await exec('cat ~/.migrate_profile');
    if (stderr) {
        console.log('Could not find .migrate_profile, please ensure your credentials are within this file in the root directory')
        process.exit(1)
    }
    // console.log('stdout:', stdout.split(/\r?\n/));
    const splitedData = stdout.split(/\r?\n/)
    const keyValuePair = {}
    for (const data of splitedData) {
        if(data.includes('=') && data.length) {
            const val = data.split("=")
            keyValuePair[val[0]] =val[1]
        }
    }
    return keyValuePair
  } catch (e) {
    console.log('Could not find .migrate_profile, please ensure your credentials are within this file in the root directory')
    process.exit(1)
  }
}

module.exports = readCredentials


