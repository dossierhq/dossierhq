import chalk from 'chalk';
import {
  isEntityTypeField,
  isEntityTypeItemField,
  isEntityTypeListField,
  isItemAdminEntity,
  isLocationField,
  isLocationItemField,
  isLocationListField,
  isRichTextField,
  isRichTextItemField,
  isRichTextListField,
  isStringField,
  isStringItemField,
  isStringListField,
  isValueTypeField,
  isValueTypeItemField,
  isValueTypeListField,
  visitItemRecursively,
} from '@datadata/core';
import type {
  AdminEntity2,
  BoundingBox,
  Entity,
  EntityTypeSpecification,
  ErrorResult,
  ErrorType,
  FieldSpecification,
  Location,
  RichText,
  ValueItem,
  ValueTypeSpecification,
} from '@datadata/core';
import type { CliContext } from '..';

export function logErrorResult(
  message: string,
  errorResult: ErrorResult<unknown, ErrorType>
): void {
  console.log(
    `${chalk.yellow(chalk.bold('!'))} ${chalk.bold(message + ':')} ${formatErrorResult(
      errorResult
    )}`
  );
}

export function formatErrorResult(errorResult: ErrorResult<unknown, ErrorType>): string {
  return `${chalk.yellow(errorResult.error)} ${errorResult.message}`;
}

export function logError(error: Error): void {
  console.log(
    `${chalk.yellow(chalk.bold('!'))} ${chalk.bold('Caught error' + ':')} ${chalk.yellow(error)}`
  );
  console.log(error);
}

export function logErrorMessage(error: string, message: string): void {
  console.log(`${chalk.yellow(chalk.bold('!'))} ${chalk.bold(error + ':')} ${message}`);
}

export function logKeyValue(key: string, value: string): void {
  console.log(`${chalk.bold(`${key}:`)} ${value}`);
}

export function logEntity(context: CliContext, entity: AdminEntity2 | Entity): void {
  const { schema } = context;
  logKeyValue('type', entity.info.type);
  logKeyValue('name', entity.info.name);
  logKeyValue('id', entity.id);
  if (isItemAdminEntity(entity)) {
    logKeyValue('version', String(entity.info.version));
    logKeyValue('publishing state', entity.info.publishingState);
  }

  visitItemRecursively<{ indent: string }>({
    schema,
    item: entity,
    visitField: (path, fieldSpec, data, visitContext) => {
      let value;
      if (isEntityTypeItemField(fieldSpec, data)) {
        //TODO use cached info of entity
        value = data ? data.id : chalk.grey('<not set>');
      } else if (isValueTypeItemField(fieldSpec, data)) {
        value = data ? formatValueItemOneLine(data) : chalk.grey('<not set>');
      } else if (isStringItemField(fieldSpec, data)) {
        value = data ? data : chalk.grey('<not set>');
      } else if (isRichTextItemField(fieldSpec, data)) {
        value = data ? formatRichTextOneLine(data) : chalk.grey('<not set>');
      } else if (isLocationItemField(fieldSpec, data)) {
        value = data ? formatLocation(data) : chalk.grey('<not set>');
      } else {
        throw new Error(`Unknown type (${fieldSpec.type})`);
      }
      const listIndex = Number.isInteger(path[path.length - 1]) ? path[path.length - 1] : undefined;
      logKeyValue(
        visitContext.indent + (listIndex === undefined ? fieldSpec.name : listIndex),
        value
      );
    },
    visitRichTextBlock: (path, _fieldSpec, block, visitContext) => {
      const blockIndex = path[path.length - 1];
      logKeyValue(visitContext.indent + blockIndex, `${block.type}: ${JSON.stringify(block.data)}`);
    },
    enterList: (path, fieldSpec, list, { indent }) => {
      console.log(indent + chalk.bold(fieldSpec.name));
      return { indent: indent + '  ' };
    },
    enterValueItem: (path, fieldSpec, valueItem, { indent }) => ({ indent: indent + '  ' }),
    enterRichText: (path, fieldSpec, valueItem, { indent }) => ({ indent: indent + '  ' }),
    initialVisitContext: { indent: '' },
  });
}

export function formatEntityOneLine(entity: Entity | AdminEntity2): string {
  if (isItemAdminEntity(entity)) {
    return `${entity.info.type} | ${entity.info.publishingState} | ${chalk.bold(
      entity.info.name
    )} | ${entity.id}`;
  }
  return `${entity.info.type} | ${chalk.bold(entity.info.name)} | ${entity.id}`;
}

export function formatValueItemOneLine(value: ValueItem): string {
  return `${value._type}`;
}

export function formatRichTextOneLine(value: RichText): string {
  return `${chalk.grey('[')}${value.blocks.map((b) => b.type).join(chalk.grey(', '))}${chalk.grey(
    ']'
  )}`;
}

export function formatLocation({ lat, lng }: Location): string {
  return `${chalk.grey('(')}${lat}${chalk.grey(',')} ${lng}${chalk.grey(')')}`;
}

export function formatBoundingBox({ minLat, maxLat, minLng, maxLng }: BoundingBox): string {
  return `${minLat}${chalk.grey('–')}${maxLat}${chalk.grey(',')} ${minLng}${chalk.grey(
    '–'
  )}${maxLng}`;
}

export function formatFieldValue(fieldSpec: FieldSpecification, value: unknown): string {
  if (isEntityTypeField(fieldSpec, value)) {
    //TODO use cached info of entity
    return value ? value.id : chalk.grey('<not set>');
  }
  if (isEntityTypeListField(fieldSpec, value)) {
    if (!value) {
      return chalk.grey('<not set>');
    }
    //TODO use cached info of entity
    return value.map((it) => it.id).join(chalk.grey(', '));
  }
  if (isValueTypeField(fieldSpec, value)) {
    if (!value) {
      return chalk.grey('<not set>');
    }
    return formatValueItemOneLine(value);
  }
  if (isValueTypeListField(fieldSpec, value)) {
    if (!value) {
      return chalk.grey('<not set>');
    }
    return value.map(formatValueItemOneLine).join(chalk.grey(', '));
  }
  if (isStringField(fieldSpec, value)) {
    return value ? value : chalk.grey('<not set>');
  }
  if (isStringListField(fieldSpec, value)) {
    return value ? value.join(chalk.grey(', ')) : chalk.grey('<not set>');
  }
  if (isRichTextField(fieldSpec, value)) {
    return value ? formatRichTextOneLine(value) : chalk.grey('<not set>');
  }
  if (isRichTextListField(fieldSpec, value)) {
    return value
      ? value.map(formatRichTextOneLine).join(chalk.grey(', '))
      : chalk.grey('<not set>');
  }
  if (isLocationField(fieldSpec, value)) {
    return value ? formatLocation(value) : chalk.grey('<not set>');
  }
  if (isLocationListField(fieldSpec, value)) {
    return value ? value.map(formatLocation).join(chalk.grey(', ')) : chalk.grey('<not set>');
  }
  throw new Error(`Unknown type (${fieldSpec.type})`);
}

export function getEntitySpec(context: CliContext, type: string): EntityTypeSpecification {
  const { schema } = context;
  const entitySpec = schema.getEntityTypeSpecification(type);
  if (!entitySpec) {
    throw new Error(`Couldn't find entity spec for type: ${type}`);
  }
  return entitySpec;
}

export function getValueSpec(context: CliContext, valueItem: ValueItem): ValueTypeSpecification {
  const { schema } = context;
  const valueSpec = schema.getValueTypeSpecification(valueItem._type);
  if (!valueSpec) {
    throw new Error(`Couldn't find value spec for type: ${valueItem._type}`);
  }
  return valueSpec;
}
