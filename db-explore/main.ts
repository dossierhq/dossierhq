#!/usr/bin/env npx ts-node
require('dotenv').config();
import chalk from 'chalk';
import inquirer, { ChoiceBase } from 'inquirer';
import * as Core from './Core';
import type { Entity, Session } from './Core';
import * as Db from './Db';
import * as TypeSpecifications from './TypeSpecifications';

interface State {
  session: Session | null;
  entity: Entity | null;
}
const state: State = { session: null, entity: null };

function getSession(): Session {
  if (!state.session) {
    throw new Error('No active session');
  }
  return state.session;
}

function getEntity(): Entity {
  if (!state.entity) {
    throw new Error('No selected entity');
  }
  return state.entity;
}

async function menuCreateSession() {
  const principals = await Core.selectAllPrincipals();
  const { principalIndex } = await inquirer.prompt([
    {
      name: 'principalIndex',
      type: 'list',
      message: 'Which principal?',
      choices: principals.map((p, index) => ({
        value: index,
        name: `${p.provider} / ${p.identifier}`,
      })),
    },
  ]);
  const selectedPrincipal = principals[principalIndex];
  state.session = await Core.createSessionForPrincipal(
    selectedPrincipal.provider,
    selectedPrincipal.identifier
  );
}

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

async function menuEditEntryFields(
  type: string,
  defaultName: string,
  defaultValues: Record<string, unknown>
) {
  const entitySpec = TypeSpecifications.getEntityTypeSpecification(type);
  const { fieldsToEdit }: { fieldsToEdit: string[] } = await inquirer.prompt([
    {
      name: 'fieldsToEdit',
      type: 'checkbox',
      message: 'Select which fields to edit',
      choices: entitySpec.fields.map((fieldSpec) => ({
        value: fieldSpec.name,
        name: fieldSpec.name,
        checked: true,
      })),
    },
  ]);

  if (fieldsToEdit.length === 0) {
    return null;
  }

  const fieldValues = await inquirer.prompt(
    fieldsToEdit.map((fieldName) => ({
      name: fieldName,
      type: 'input',
      message: TypeSpecifications.getEntityFieldSpecification(
        entitySpec,
        fieldName
      ).name,
      default: defaultValues[fieldName],
    }))
  );

  const nameFieldName = entitySpec.fields.find((x) => x.isName)?.name;

  const newName =
    nameFieldName && fieldValues[nameFieldName]
      ? fieldValues[nameFieldName]
      : defaultName;
  return { name: newName, fields: fieldValues };
}

async function menuCreateEntity() {
  const session = getSession();

  const { type } = await inquirer.prompt([
    {
      name: 'type',
      type: 'list',
      choices: TypeSpecifications.getAllEntitySpecifications().map((x) => ({
        value: x.name,
        name: x.name,
      })),
    },
  ]);

  const result = await menuEditEntryFields(type, '(Untitled)', {});
  if (result) {
    await Core.createEntity(session, type, result.name, result.fields);
  }
}

async function menuEditEntity(entity: Entity) {
  const session = getSession();

  const result = await menuEditEntryFields(
    entity.type,
    entity.name,
    entity.fields
  );
  if (result) {
    await Core.updateEntity(session, entity.uuid, result.name, result.fields);
  }
}

async function menuSelectEntity() {
  const entities = await Core.getAllEntities();
  const { entityIndex } = await inquirer.prompt([
    {
      name: 'entityIndex',
      type: 'list',
      message: 'Which entity?',
      choices: entities.map((e, index) => ({
        value: index,
        name: `${e.type} / ${e.name} (${e.uuid})`,
      })),
    },
  ]);
  state.entity = entities[entityIndex];
}

function dumpState() {
  console.log(
    `\n${chalk.cyan('Session:')} ${state.session ? chalk.bold('set') : 'null'}`
  );
  if (state.entity) {
    console.log(
      `${chalk.cyan('Entity:')} ${state.entity.name} / ${
        state.entity.type
      } ${chalk.italic(`(${state.entity.uuid})`)}`
    );
  }
  console.log();
}

type ChoiceInit =
  | { value: unknown; name: string; disabled?: boolean }
  | ChoiceBase;

function cleanupChoices(choiceInits: ChoiceInit[]) {
  return choiceInits.map((x) => {
    if (x instanceof Object && (x as any)['disabled']) {
      return new inquirer.Separator((x as any).name);
    }
    return x;
  });
}

async function mainMenu() {
  let lastChoice = null;
  while (true) {
    dumpState();
    const choices = [
      { value: 'create-session', name: 'Create session with principal' },
      { value: 'create-principal', name: 'Create principal' },
      { value: 'dump-principals', name: 'Dump principals' },
      new inquirer.Separator(),
      {
        value: 'create-entity',
        name: 'Create entity',
        disabled: !state.session,
      },
      {
        value: 'edit-entity',
        name: 'Edit entity',
        disabled: !state.session || !state.entity,
      },
      { value: 'get-all-entities', name: 'Show all entities' },
      { value: 'select-entity', name: 'Select entity' },
      { value: 'show-entity', name: 'Show entity', disabled: !state.entity },
      {
        value: 'delete-entity',
        name: 'Delete entity',
        disabled: !state.session || !state.entity,
      },
      new inquirer.Separator(),
      { value: 'exit', name: 'Exit' },
    ];
    const answers: any = await inquirer.prompt([
      {
        name: 'action',
        type: 'list',
        pageSize: 20,
        message: 'What do you want to do?',
        default: lastChoice,
        choices: cleanupChoices(choices),
      },
    ]);
    lastChoice = answers.action;
    try {
      switch (answers.action) {
        case 'create-session':
          await menuCreateSession();
          break;
        case 'create-principal':
          await menuCreatePrincipal();
          break;
        case 'dump-principals': {
          const principals = await Core.selectAllPrincipals();
          console.table(principals);
          break;
        }
        case 'create-entity':
          await menuCreateEntity();
          break;
        case 'edit-entity':
          await menuEditEntity(getEntity());
          break;
        case 'get-all-entities': {
          const entities = await Core.getAllEntities();
          console.table(entities);
          break;
        }
        case 'select-entity':
          await menuSelectEntity();
          break;
        case 'show-entity':
          console.table({
            uuid: state.entity?.uuid,
            name: state.entity?.name,
            type: state.entity?.type,
          });
          console.log('Fields');
          console.table(state.entity?.fields);
          break;
        case 'delete-entity': {
          await Core.deleteEntity(getSession(), getEntity().uuid);
          state.entity = null;
          break;
        }
        case 'exit':
          return;
        default:
          throw Error(`Unhandled action: ${answers.action}`);
      }
    } catch (error) {
      console.warn('Caught error', error);
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
