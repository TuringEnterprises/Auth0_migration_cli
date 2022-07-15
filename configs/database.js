import 'dotenv/config';

console.log(process.env.POSTMATCH_DB_PORT);

const dbConfigs = {
  host: process.env.POSTMATCH_DB_HOST || "localhost",
  user: process.env.POSTMATCH_DB_USER || "turingdev",
  database: process.env.POSTMATCH_DB_NAME || "turing_post_match",
  password: process.env.POSTMATCH_DB_PASSWORD || "hoptd1234",
  port: process.env.POSTMATCH_DB_PORT || "1306",
  userTable: process.env.POSTMATCH_DB_USER_TABLE || "postmatch_user"
};

export default dbConfigs;
