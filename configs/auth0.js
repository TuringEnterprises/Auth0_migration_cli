import 'dotenv/config';

const auth0Configs = {
  client_id: process.env.AUTH0_CLIENT_ID || 'YOUR_CLIENT_ID',
  client_secret: process.env.AUTH0_CLIENT_SECRET || 'YOUR_CLIENT_SECRET',
  domain: process.env.AUTH0_DOMAIN ? `https://${process.env.AUTH0_DOMAIN}` : 'YOUR_DOMAIN',
  audience: process.env.AUTH0_DOMAIN ? `https://${process.env.AUTH0_DOMAIN}/api/v2/` : 'YOUR_AUDIENCE',
  connection_id: process.env.AUTH0_DB_CONNECTION_ID || 'YOUR_DB_CONNECTION_ID',
  grant_type: 'client_credentials',
};

export default auth0Configs;
