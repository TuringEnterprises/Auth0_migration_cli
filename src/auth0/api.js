import axios from "axios";
import auth0Configs from "../../configs/auth0.js";

const getAccessToken = async () => {
    try {
        const res = await axios.post(
            `${auth0Configs.domain}/oauth/token`,
            auth0Configs,
            { headers: { "content-type": "application/json" } },
        );
        return res.data?.access_token;
    } catch (error) {
        console.error(`Error on fetching auth0 access token: ${error.message}`);
    }
};

export const makeAuth0RequestHeaders = async () => {
    const accessToken = await getAccessToken();
    return ({
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`
    });
};