#!/usr/bin/env npx ts-node
require('dotenv').config();
import inquirer from 'inquirer';
import * as Core from './Core';
import * as Db from './Db';

async function menuCreatePrincipal() {
  const answers = await inquirer.prompt([
    {
      name: 'action',
      type: 'list',
      message: 'Which principal?',
      choices: [
        { value: 'enter', name: 'Enter' },
        { value: 'hardcoded', name: 'sys/12345' },
      ],
    },
  ]);

  let provider = '';
  let identifier = '';

  switch (answers.action) {
    case 'enter':
      const answers = await inquirer.prompt([
        {
          name: 'provider',
          type: 'input',
          message: 'Which provider?',
          default: 'sys',
        },
        { name: 'identifier', type: 'input', message: 'Which identifier?' },
      ]);

      provider = answers.provider;
      identifier = answers.identifier;

      break;
    case 'hardcoded': {
      provider = 'sys';
      identifier = '12345';
      break;
    }
  }
  await Core.createPrincipal(provider, identifier);
}

async function mainMenu() {
  let lastChoice = null;
  while (true) {
    const answers: any = await inquirer.prompt([
      {
        name: 'action',
        type: 'list',
        pageSize: 20,
        message: 'What do you want to do?',
        default: lastChoice,
        choices: [
          { value: 'create-principal', name: 'Create principal' },
          { value: 'dump-principals', name: 'Dump principals' },
          new inquirer.Separator(),
          { value: 'exit', name: 'Exit' },
        ],
      },
    ]);
    lastChoice = answers.action;
    switch (answers.action) {
      case 'create-principal':
        await menuCreatePrincipal();
        break;
      case 'dump-principals':
        const principals = await Core.selectAllPrincipals();
        console.table(principals);
        break;
      case 'exit':
        return;
      default:
        throw Error(`Unhandled action: ${answers.action}`);
    }
  }
}

async function main() {
  await mainMenu();
}

if (require.main === module) {
  main()
    .then(Db.shutDownAsync)
    .catch((error) => {
      console.warn(error);
      process.exitCode = 1;
    });
}
