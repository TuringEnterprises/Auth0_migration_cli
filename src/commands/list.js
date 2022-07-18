import { getUserList } from "../database/service.js";
import chalk from "chalk";

async function list() {
    // Get the list of users
    const arrUsers = await getUserList();

    console.log(chalk.blue.bold("--- List of users ---\n"), arrUsers);
}

export default list;