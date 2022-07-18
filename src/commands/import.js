import fs from "fs";
import chalk from "chalk";
import { importUsers, checkImportStatus } from "../auth0/service.js";
import { getUsersForImport } from "../database/service.js";
import { getImportFilePath } from "../utils.js";

const JOB_COMPLETED_STATUS = "completed";

async function bulkImport() {

    // Fetch the users from Turing db and write in a json file
    const arrUsers = await getUsersForImport();
    fs.writeFileSync(getImportFilePath(), JSON.stringify(arrUsers));

    // Start Auth0 bulk import job
    const importJob = await importUsers();
    console.log("Started import job with id: ", importJob?.id);

    // Wait for job completion and print summary
    await trackStatus(importJob?.id);
}

async function trackStatus(jobId) {
    const jobState = await checkImportStatus(jobId);
    if (jobState?.status === JOB_COMPLETED_STATUS) {
        printImportSummary(jobState.summary);
    } else {
        console.log("...");
        setTimeout(trackStatus, 200, jobId);
    }
}

function printImportSummary(summary) {
    console.log(chalk.yellow("--------------------------------------------"));
    console.log(chalk.red(`Failed: ${summary.failed}`));
    console.log(chalk.green(`Updated: ${summary.updated}`));
    console.log(chalk.green(`Inserted: ${summary.inserted}`));
    console.log(chalk.yellow("--------------------------------------------"));
    console.log(chalk.green.bold(`Total: ${summary.total}`));
}

export default bulkImport;