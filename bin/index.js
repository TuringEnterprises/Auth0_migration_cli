#! /usr/bin/env node

import { program } from 'commander';
import { countUsers, listUsers, importUsers, createUser } from '../src/commands/index.js';

program
    .command('count')
    .description('Show total count of users for import')
    .action(countUsers);

program
    .command('list')
    .description('List all accounts for import')
    .action(listUsers);

program
    .command('create')
    .description('Create a new user in Auth0')
    .option('-n, --name <name>', 'Name of the user', 'John Doe')
    .option('-p, --password <password>', 'User password')
    .requiredOption('-e, --email <email>', 'Email address of the user')
    .action(createUser);

program
    .command('import')
    .description('Import bulk users')
    .action(importUsers);

program.parse();