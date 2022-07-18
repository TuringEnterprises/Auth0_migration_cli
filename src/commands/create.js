import { createUser as createAuth0User } from "../auth0/service.js";
import chalk from "chalk";

async function createUser({ email, name, password }) {

    console.log(chalk.bgBlue("  Creating a user with email: "), email);
    const createSuccess = await createAuth0User({ email, name, password });
    if( createSuccess ) {
        console.log(chalk.green.bold("--- Success ---"));
    } else {
        console.log(chalk.red.bold("Operation failed"));
    }
}

export default createUser;