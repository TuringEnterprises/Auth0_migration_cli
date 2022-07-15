import axios from "axios";
import fs from "fs";
import chalk from "chalk";
import FormData from "form-data";
import auth0Configs from "../../configs/auth0.js";
import { getImportFilePath } from "../utils.js";
import { makeAuth0RequestHeaders } from "./api.js";

export const createUser = async ({ email, name, password }) => {
    try {
        const headers = await makeAuth0RequestHeaders();

        await axios.post(
            `${auth0Configs.domain}/api/v2/users`,
            {
                email,
                name,
                password,
                "connection": "Username-Password-Authentication",
            },
            { headers },
        );

        return true;
    } catch (error) {
        console.error(chalk.bgRed(" Failed to create a user: "));
        console.error(chalk.yellow(error.message));
    }
};

export const importUsers = async () => {
    try {
        const headers = await makeAuth0RequestHeaders();

        const data = new FormData();
        data.append("users", fs.createReadStream(getImportFilePath()));
        data.append("upsert", "true");
        data.append("send_completion_email", "false");
        data.append("connection_id", auth0Configs.connection_id);

        const response = await axios.post(
            `${auth0Configs.domain}/api/v2/jobs/users-imports`,
            data,
            { headers },
        );

        return response.data;

    } catch (error) {
        console.error(`Failed to import bulk users: ${error.message}`);
    }
};

export const checkImportStatus = async (jobId) => {
    try {
        // const accessToken = await getAccessToken();
        const headers = await makeAuth0RequestHeaders();

        const {data} = await axios.get(
            `${auth0Configs.domain}/api/v2/jobs/${jobId}`,
            { headers },
        );
        return data;
    } catch (error) {
        console.error(chalk.bgRed(" Failed to check import job status: "));
        console.error(chalk.yellow(error.message));
    }
};