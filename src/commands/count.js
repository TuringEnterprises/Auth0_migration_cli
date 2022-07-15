import { getUsersCount } from "../database/service.js";
import chalk from "chalk";

async function countUsers() {

    const usersCount = await getUsersCount();
    console.log(chalk.green.bold("--- Total count of users to be imported ---"));
    console.log(chalk.bgYellow.bold(usersCount));
}

export default countUsers;